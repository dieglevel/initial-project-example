import React from "react";
import { useMotionValue, useAnimationFrame } from "framer-motion";

type UseLoopParallaxOptions = {
	speed?: number; // pixels per second
	direction?: 1 | -1;
	pause?: boolean;
};

/**
 * Returns a motion value 'pos' which can be used as x or y style for a looping translation.
 * The consumer should render the content twice (or more) to produce a seamless loop.
 */
export function useLoopParallax({
	speed = 100,
	direction = -1,
	pause = false,
}: UseLoopParallaxOptions) {
	const pos = useMotionValue(0);
	const runningRef = React.useRef(!pause);

	React.useEffect(() => {
		runningRef.current = !pause;
	}, [pause]);

	// Update position every frame using framer-motion's useAnimationFrame.
	useAnimationFrame((_, delta) => {
		if (!runningRef.current) return;
		// delta is in milliseconds
		const deltaSeconds = delta / 1000;
		// move relative to speed and direction
		pos.set(pos.get() + direction * speed * deltaSeconds);
	});

	return pos;
}

export default useLoopParallax;
