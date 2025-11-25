import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { useBreadcrumStore } from "@/pages/_dashboard/store/breadcrumb.slice";
import { Fragment, useEffect } from "react";
import { useAuth } from "@/shared/hooks/use-auth";

export default function NavbarBreadcrum() {
	const { data: breadcrumb, set } = useBreadcrumStore();
	const { payload } = useAuth();
	useEffect(() => {
		set([
			{ name: "Home", path: "/dashboard" },
			{ name: "Home", path: "/dashboard" },
			{ name: "Home", path: "/dashboard" },
			{ name: "Home", path: "/dashboard" },
			{ name: "Adu", path: null },
			{ name: `${payload?.sub}`, path: null },
		]);
	}, [set]);

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumb.map((item, index) => {
					if (index === breadcrumb.length - 1)
						return (
							<BreadcrumbItem key={index}>
								<BreadcrumbPage>{item.name}</BreadcrumbPage>
							</BreadcrumbItem>
						);

					return (
						<Fragment key={index}>
							<BreadcrumbItem className="hidden md:block">
								<BreadcrumbLink key={index} href={item.path || "#"}>
									{item.name}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
						</Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
