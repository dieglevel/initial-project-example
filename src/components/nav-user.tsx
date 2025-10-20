import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
	Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		avatar: string;
	};
}) {
	const { isMobile } = useSidebar();
	const { logout, user: authUser } = useAuth();

	const handleLogout = async () => {
		try {
			await logout();
			// Redirect will be handled by AuthProvider
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	// Use auth user data if available, fallback to prop user
	const displayUser = authUser
		? {
				name: authUser.username || authUser.email || "User",
				email: authUser.email || "user@example.com",
				avatar: authUser.profile?.avatar || user.avatar,
		  }
		: user;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									src={displayUser.avatar}
									alt={displayUser.name}
								/>
								<AvatarFallback className="rounded-lg">
									{displayUser.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{displayUser.name}
								</span>
								<span className="truncate text-xs">
									{displayUser.email}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage
										src={displayUser.avatar}
										alt={displayUser.name}
									/>
									<AvatarFallback className="rounded-lg">
										{displayUser.name.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{displayUser.name}
									</span>
									<span className="truncate text-xs">
										{displayUser.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						{/* <DropdownMenuSeparator /> */}
						{/* <DropdownMenuGroup>
							<DropdownMenuItem>
								<Sparkles />
								Nâng cấp Pro
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<BadgeCheck />
								Tài khoản
							</DropdownMenuItem>
							<DropdownMenuItem>
								<CreditCard />
								Thanh toán
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Bell />
								Thông báo
							</DropdownMenuItem>
						</DropdownMenuGroup> */}
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout}>
							<LogOut />
							Đăng xuất
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
