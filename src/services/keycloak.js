import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "viajesgvr",
  clientId: "viajesgvr-frontend",
});

export default keycloak;