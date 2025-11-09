"use client";

import * as React from "react";

import { NavMain } from "@/shared/components/sidebar/nav-main";
import { NavProjects } from "@/shared/components/sidebar/nav-projects";
import { NavUser } from "@/shared/components/sidebar/nav-user";
import { TeamSwitcher } from "@/shared/components/sidebar/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/shared/components/ui/sidebar";
import { SidebarData } from "../../common/sidebar.constant";

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
