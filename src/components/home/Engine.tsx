import React from "react";
import { motion, useMotionValue } from "framer-motion";
import useLoopParallax from "../motion/use-loop-parallax";

type LoopParallaxProps = {
	children: React.ReactNode;
	speed?: number;
	direction?: 1 | -1;
	axis?: "x" | "y";
	className?: string;
	style?: React.CSSProperties;
	pauseOnHover?: boolean;
};

/**
 * LoopParallax
 * - Renders children duplicated and translates them infinitely using a motion value from the hook.
 * - Works by measuring the width (or height) of one content block and wrapping translation with modulo.
 */
export function LoopParallax({
	children,
	speed = 80,
	direction = -1,
	axis = "x",
	className,
	style,
	pauseOnHover = true,
}: LoopParallaxProps) {
	const wrapperRef = React.useRef<HTMLDivElement | null>(null);
	const contentRef = React.useRef<HTMLDivElement | null>(null);
	const [contentSize, setContentSize] = React.useState(0);
	const [isPaused, setIsPaused] = React.useState(false);

	// motion value that moves continuously
	const pos = useLoopParallax({ speed, direction, pause: isPaused });

	// derived motion value used for visible translation (kept inside [0, contentSize))
	const visible = useMotionValue(0);

	// measure size of the content (one copy)
	React.useLayoutEffect(() => {
		const measure = () => {
			if (!contentRef.current) return;
			const rect = contentRef.current.getBoundingClientRect();
			setContentSize(
				axis === "x" ? Math.round(rect.width) : Math.round(rect.height),
			);
		};
		measure();
		const ro = new ResizeObserver(measure);
		if (contentRef.current) ro.observe(contentRef.current);
		window.addEventListener("resize", measure);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [axis]);

	// keep visible value wrapped to avoid runaway numbers
	React.useEffect(() => {
		if (!contentSize) return;
		const unsubscribe = pos.onChange((v) => {
			// normalized in [0, contentSize)
			const mod = ((v % contentSize) + contentSize) % contentSize;
			// translate negative so content moves in expected direction
			visible.set(-mod);
		});
		return unsubscribe;
	}, [pos, contentSize, visible]);

	const commonProps = {
		onMouseEnter: pauseOnHover ? () => setIsPaused(true) : undefined,
		onMouseLeave: pauseOnHover ? () => setIsPaused(false) : undefined,
	};

	const motionStyle = axis === "x" ? { x: visible } : { y: visible };

	return (
		<div
			ref={wrapperRef}
			className={className}
			style={{ overflow: "hidden", display: "block", ...(style || {}) }}
			{...commonProps}
		>
			<motion.div
				style={{
					display: "flex",
					flexWrap: "nowrap",
					alignItems: "center",
					...motionStyle,
				}}
				aria-hidden
			>
				{/* first copy */}
				<div
					ref={contentRef}
					style={{ display: "inline-flex", whiteSpace: "nowrap" }}
				>
					{children}
				</div>

				{/* second copy for seamless looping */}
				<div style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
					{children}
				</div>
			</motion.div>
		</div>
	);
}

// Example Engine container using LoopParallax
export default function Engine() {
	return (
		<div style={{ padding: 20 }}>
			<h3 style={{ marginBottom: 12 }}>Loop Parallax demo</h3>
			<LoopParallax speed={120} className="loop-parallax" style={{}}>
				{/* sample items - replace with images or complex elements */}
				<div style={{ display: "flex", gap: 16 }}>
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={i}
							style={{
								minWidth: 160,
								height: 80,
								background: `hsl(${(i * 40) % 360} 70% 55%)`,
								color: "white",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								borderRadius: 8,
								boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
							}}
						>
							Item {i + 1}
						</div>
					))}
				</div>
			</LoopParallax>
		</div>
	);
}
