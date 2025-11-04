import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function usePageTransitionNavigate() {
	const [isAnimating, setIsAnimating] = useState(false);
	const [nextPath, setNextPath] = useState<string | null>(null);
	const navigate = useNavigate();

	const triggerTransition = useCallback((path: string) => {
		setIsAnimating(true);
		setNextPath(path);
	}, []);

	const handleComplete = useCallback(() => {
		if (nextPath) {
			navigate(nextPath);
			setIsAnimating(false);
			setNextPath(null);
		}
	}, [nextPath, navigate]);

	return { isAnimating, triggerTransition, handleComplete };
}
