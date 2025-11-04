import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Hero() {
	const jobs = ["Frontend Developer", "Backend Developer", "UI Designer"];
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setIndex((prev) => (prev + 1) % jobs.length);
		}, 2000);
		return () => clearInterval(interval);
	}, [jobs.length]);

	return (
		<div className="flex justify-center flex-col h-screen  bg-gradient-to-r from-blue-900 to-slate-900">
			<div className="mx-auto px-4 ">
				<h1 className="text-5xl mb-6 font-bold text-white">
					Hi! My name is Minh
				</h1>
				<motion.h1
					key={index} // quan trọng để framer motion nhận diện mỗi job là phần tử mới
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.5, ease: "easeInOut" }}
					className="text-3xl font-bold text-blue-300"
				>
					{jobs[index]}
				</motion.h1>
				<p className="text-blue-400 max-w-1/2 mt-10">
					A passionate developer with expertise in Next.js, React, Tailwind
					CSS, and blockchain technologies. Currently pursuing a Master's
					in Computer Science at Northeastern University.
				</p>
			</div>
		</div>
	);
}
