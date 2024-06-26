import { AddGameForm } from "@/src/features/add-game";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/shared/ui/breadcrumb";
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
              <BreadcrumbPage>Add Game</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AddGameForm />
      </div>
    </>
  );
}
