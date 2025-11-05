import { AppPaths } from "@/pages/appPaths";
import {
	AudioWaveform,
	Command,
	GalleryVerticalEnd,
	SquareTerminal,
	type LucideProps,
} from "lucide-react";

interface IUser {
	name: string;
	email: string;
	avatar: string;
}

const user: IUser = {
	name: "shadcn",
	email: "m@example.com",
	avatar: "/avatars/shadcn.jpg",
};

interface ITeam {
	name: string;
	logo: React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;
	plan: string;
}

const teams: ITeam[] = [
	{
		name: "Acme Inc",
		logo: GalleryVerticalEnd,
		plan: "Enterprise",
	},
	{
		name: "Acme Corp.",
		logo: AudioWaveform,
		plan: "Startup",
	},
	{
		name: "Evil Corp.",
		logo: Command,
		plan: "Free",
	},
];

interface INavMainItem {
	title: string;
	url: string;
	icon: React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;
	isActive?: boolean;
	items: {
		title: string;
		url: string;
	}[];
}

const navMain: INavMainItem[] = [];

interface IProject {
	name: string;
	url: string;
	icon: React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;
}

const projects: IProject[] = [
	{
		name: "Todo",
		url: AppPaths.dashboard.todo,
		icon: SquareTerminal,
	},
];

export const SidebarData = {
	user,
	teams,
	navMain,
	projects,
};
