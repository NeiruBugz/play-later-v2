import { AddGameForm } from "@/src/widgets/add-game-form";
import { Header } from "@/src/widgets/header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/shared/ui/breadcrumb";

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
              <BreadcrumbPage>Add Game</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AddGameForm />
      </div>
    </>
  );
}
