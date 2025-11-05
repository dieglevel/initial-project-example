"use client";

import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarData } from "./data";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={SidebarData.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={SidebarData.navMain} />
				<NavProjects projects={SidebarData.projects} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={SidebarData.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
