import { servicesForIntegration } from "../lib/services-for-integration";
import { ServiceIntegration } from "./service-integration";

export function IntegrationsList() {
  return (
    <div className="flex flex-col gap-4">
      {servicesForIntegration.map((service) => (
        <ServiceIntegration key={service.id} {...service} />
      ))}
    </div>
  );
}
