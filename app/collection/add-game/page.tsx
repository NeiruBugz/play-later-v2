import { AddGameForm } from "@/src/features/add-game/ui/add-game-form";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbEllipsis, BreadcrumbPage } from "@/src/shared/ui/breadcrumb";
import { Header } from "@/src/widgets/header";

export default function AddGamePage() {
  return (
    <>
      <Header />
      <div className="container">
        <Breadcrumb className="my-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Collection</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Add Game</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AddGameForm />
      </div>
    </>
  );
}
