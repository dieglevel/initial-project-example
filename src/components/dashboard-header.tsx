import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface DashboardHeaderProps {
	breadcrumbs?: BreadcrumbItem[];
	currentPage?: string;
}

export function DashboardHeader({
	breadcrumbs = [],
	currentPage,
}: DashboardHeaderProps) {
	return (
		<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
			<div className="flex items-center gap-2 px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 data-[orientation=vertical]:h-4"
				/>
				<Breadcrumb>
					<BreadcrumbList>
						{breadcrumbs.map((crumb: BreadcrumbItem, index: number) => (
							<BreadcrumbItem key={index} className="hidden md:block">
								{crumb.href ? (
									<BreadcrumbLink href={crumb.href}>
										{crumb.label}
									</BreadcrumbLink>
								) : (
									<span>{crumb.label}</span>
								)}
								{index < breadcrumbs.length - 1 && (
									<BreadcrumbSeparator className="hidden md:block" />
								)}
							</BreadcrumbItem>
						))}
						{currentPage && breadcrumbs.length > 0 && (
							<>
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									<BreadcrumbPage>{currentPage}</BreadcrumbPage>
								</BreadcrumbItem>
							</>
						)}
					</BreadcrumbList>
				</Breadcrumb>
			</div>
		</header>
	);
}
