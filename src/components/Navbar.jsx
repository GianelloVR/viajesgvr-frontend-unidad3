import { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import httpCommon from "../http-common";

const CART_STORAGE_KEY = "multiPackageCart";

const getCartCount = () => {
  try {
    return (JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || []).length;
  } catch (error) {
    console.error("Error reading cart count:", error);
    return 0;
  }
};

function Navbar() {
  const { keycloak, initialized } = useKeycloak();
  const [backendFullName, setBackendFullName] = useState(
    localStorage.getItem("userFullName") || ""
  );
  const [cartCount, setCartCount] = useState(getCartCount());

  const isAuthenticated = initialized && keycloak.authenticated;

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const userRole = roles.includes("ADMIN")
    ? "ADMIN"
    : roles.includes("CLIENT")
    ? "CLIENT"
    : "";

  const tokenFullName =
    keycloak.tokenParsed?.name ||
    keycloak.tokenParsed?.preferred_username ||
    "";

  const userFullName = backendFullName || tokenFullName;

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const syncUserWithBackend = async () => {
      try {
        const response = await httpCommon.get("/users/me");

        const syncedFullName = response.data.fullName || tokenFullName;

        localStorage.removeItem("userAccountInactive");
        localStorage.setItem("userId", response.data.id);
        localStorage.setItem("userEmail", response.data.email || "");
        localStorage.setItem("userFullName", syncedFullName);
        localStorage.setItem("userRole", response.data.role || userRole);

        setBackendFullName(syncedFullName);

        window.dispatchEvent(new Event("userAccessChanged"));
      } catch (error) {
        console.error("Error syncing user with backend:", error);

        if (error.response?.status === 403) {
          localStorage.setItem("userAccountInactive", "true");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userFullName");

          setBackendFullName(tokenFullName);

          window.dispatchEvent(new Event("userAccessChanged"));
        }
      }
    };

    if (isAuthenticated) {
      const currentKeycloakUserId = keycloak.tokenParsed?.sub || "";
      const previousKeycloakUserId = localStorage.getItem("keycloakUserId");

      if (
        previousKeycloakUserId &&
        currentKeycloakUserId &&
        previousKeycloakUserId !== currentKeycloakUserId
      ) {
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userFullName");
        localStorage.removeItem("userAccountInactive");
        localStorage.removeItem(CART_STORAGE_KEY);
        setBackendFullName(tokenFullName);
        setCartCount(0);
      }

      localStorage.setItem("accessToken", keycloak.token || "");
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("keycloakUserId", currentKeycloakUserId);

      syncUserWithBackend();
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userFullName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("keycloakUserId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      localStorage.removeItem("userAccountInactive");
      localStorage.removeItem(CART_STORAGE_KEY);

      setBackendFullName("");
      setCartCount(0);
    }
  }, [initialized, isAuthenticated, keycloak.token, keycloak.tokenParsed, tokenFullName, userRole]);

  useEffect(() => {
    const updateNameFromProfile = () => {
      setBackendFullName(localStorage.getItem("userFullName") || tokenFullName);
    };

    window.addEventListener("profileUpdated", updateNameFromProfile);

    return () => {
      window.removeEventListener("profileUpdated", updateNameFromProfile);
    };
  }, [tokenFullName]);

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(getCartCount());
    };

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  const handleLogin = () => {
    keycloak.login({
      redirectUri: window.location.origin,
    });
  };

  const handleRegister = () => {
    keycloak.register({
      redirectUri: window.location.origin,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("keycloakUserId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userAccountInactive");
    localStorage.removeItem(CART_STORAGE_KEY);

    setBackendFullName("");
    setCartCount(0);

    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            textDecoration: "none",
            color: "#ffffff",
            fontWeight: "bold",
          }}
        >
          ViajesGVR
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button component={Link} to="/" sx={{ color: "#ffffff" }}>
            Inicio
          </Button>

          <Button component={Link} to="/" sx={{ color: "#ffffff" }}>
            Paquetes
          </Button>

          {isAuthenticated ? (
            <>
              {userRole !== "ADMIN" && (
                <Button component={Link} to="/cart" sx={{ color: "#ffffff" }}>
                  Mi compra ({cartCount})
                </Button>
              )}

              <Button component={Link} to="/my-reservations" sx={{ color: "#ffffff" }}>
                Mis reservas
              </Button>

              <Button component={Link} to="/profile" sx={{ color: "#ffffff" }}>
                Mi perfil
              </Button>

              {userRole === "ADMIN" && (
                <Button component={Link} to="/admin" sx={{ color: "#ffffff" }}>
                  Panel admin
                </Button>
              )}

              <Typography sx={{ color: "#ffffff", fontWeight: "bold" }}>
                Hola, {userFullName}
              </Typography>

              <Button onClick={handleLogout} sx={{ color: "#ffffff" }}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleLogin} sx={{ color: "#ffffff" }}>
                Iniciar sesión
              </Button>

              <Button onClick={handleRegister} sx={{ color: "#ffffff" }}>
                Registrarse
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
