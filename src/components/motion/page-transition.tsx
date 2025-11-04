import { motion, type Transition } from "framer-motion";
import type React from "react";

const transition: Transition = {
	duration: 0.6,
	ease: "easeInOut",
};

export default function PageTransition({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<motion.div
				className="fixed top-0 left-0 w-1/2 h-full bg-black z-40"
				initial={{ x: "-100%" }}
				animate={{ x: "0%", display: "none" }}
				exit={{ x: "0%" }}
				transition={{ ...transition }}
				key={"left-div"}
			/>
			<motion.div
				className="fixed top-0 right-0 w-1/2 h-full bg-black z-40"
				initial={{ x: "100%" }}
				animate={{ x: "0%", display: "none" }}
				exit={{ x: "0%" }}
				transition={{ ...transition }}
				key={"right-div"}
			/>

			<motion.div
				className="fixed top-0 left-0 w-1/2 h-full bg-black z-40"
				initial={{ x: "0%", display: "none" }}
				animate={{ x: "-100%", display: "block" }}
				exit={{ x: "0%" }}
				transition={{
					...transition,
					delay: 0.6,
				}}
				key={"left-div2"}
			/>
			<motion.div
				className="fixed top-0 right-0 w-1/2 h-full bg-black z-40"
				initial={{ x: "0%", display: "none" }}
				animate={{ x: "100%", display: "block" }}
				exit={{ x: "0%" }}
				transition={{
					...transition,
					delay: 0.6,
          
				}}
				key={"right-div2"}
			/>
			<motion.div
				key="page-transition-children"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 1 }}
				transition={{ duration: 0.4, delay: 0.6 }}
			>
				{children}
			</motion.div>
		</>
	);
}
