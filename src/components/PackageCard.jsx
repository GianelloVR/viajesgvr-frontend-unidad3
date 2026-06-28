import { Card, CardContent, Typography, Button, Stack, Chip } from "@mui/material";
import { Link } from "react-router-dom";

const CART_STORAGE_KEY = "multiPackageCart";

const getStatusLabel = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "Disponible";
    case "SOLD_OUT":
      return "Agotado";
    case "NOT_VALID":
      return "No disponible";
    case "CANCELED":
      return "Cancelado";
    default:
      return status;
  }
};

const normalizeDateOnly = (dateValue) => {
  if (!dateValue) return "";

  return String(dateValue).split("T")[0];
};

const formatDateOnly = (dateValue) => {
  const normalizedDate = normalizeDateOnly(dateValue);

  if (!normalizedDate) return "No registrada";

  return new Date(`${normalizedDate}T00:00:00`).toLocaleDateString("es-CL");
};

const calculateTourEndDate = (startDate, durationDays) => {
  if (!startDate || !durationDays) return "";

  const normalizedStartDate = normalizeDateOnly(startDate);
  const date = new Date(`${normalizedStartDate}T00:00:00`);
  date.setDate(date.getDate() + Number(durationDays));

  return date.toISOString().split("T")[0];
};

const readCartItems = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch (error) {
    console.error("Error reading cart items:", error);
    return [];
  }
};

const saveCartItems = (items) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cartUpdated"));
};

function PackageCard({ tourPackage, showCartButton = true }) {
  const promotionPercentage = Number(tourPackage.promotionDiscountPercentage || 0);
  const hasPromotion = promotionPercentage > 0;
  const isAvailable =
    tourPackage.status === "AVAILABLE" && Number(tourPackage.availableQuota || 0) > 0;

  const packageStartDate = normalizeDateOnly(tourPackage.startDate);
  const packageEndDate = normalizeDateOnly(tourPackage.endDate);

  const handleAddToCart = () => {
    if (!isAvailable) {
      alert("Este paquete no está disponible para agregar a la compra.");
      return;
    }

    const cartItems = readCartItems();
    const alreadyExists = cartItems.some(
      (item) => Number(item.id) === Number(tourPackage.id)
    );

    if (alreadyExists) {
      alert("Este paquete ya está agregado a tu compra.");
      return;
    }

    const newItem = {
      id: tourPackage.id,
      name: tourPackage.name,
      destination: tourPackage.destination,
      description: tourPackage.description,
      startDate: packageStartDate,
      endDate: packageEndDate,
      durationDays: tourPackage.durationDays,
      price: tourPackage.price,
      availableQuota: tourPackage.availableQuota,
      promotionDiscountPercentage: tourPackage.promotionDiscountPercentage || 0,
      status: tourPackage.status,
      passengerCount: 1,
      tourStartDate: packageStartDate,
      tourEndDate: calculateTourEndDate(
        packageStartDate,
        tourPackage.durationDays
      ),
      specialRequests: "",
    };

    saveCartItems([...cartItems, newItem]);
    alert("Paquete agregado a tu compra múltiple.");
  };

  return (
    <Card sx={{ width: "100%", height: "100%", borderRadius: 3, boxShadow: 3 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            sx={{ color: "#111827" }}
          >
            {tourPackage.name}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={getStatusLabel(tourPackage.status)}
              color={tourPackage.status === "AVAILABLE" ? "success" : "default"}
              size="small"
              sx={{
                width: "fit-content",
                fontWeight: "bold",
              }}
            />

            {hasPromotion && (
              <Chip
                label={`Promo ${promotionPercentage}% OFF`}
                color="warning"
                size="small"
                sx={{
                  width: "fit-content",
                  maxWidth: "100%",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                }}
              />
            )}
          </Stack>

          <Typography variant="body1" color="text.secondary">
            Destino: {tourPackage.destination}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {`Precio: $${new Intl.NumberFormat("es-CL").format(tourPackage.price)}`}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Disponible desde: {formatDateOnly(tourPackage.startDate)}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Disponible hasta: {formatDateOnly(tourPackage.endDate)}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Duración: {tourPackage.durationDays} día(s)
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Cupos disponibles: {tourPackage.availableQuota}
          </Typography>

          <Button
            variant="contained"
            component={Link}
            to={`/packages/${tourPackage.id}`}
          >
            VER DETALLE
          </Button>

          {showCartButton && (
            <Button
              variant="outlined"
              color="success"
              onClick={handleAddToCart}
              disabled={!isAvailable}
            >
              Agregar a compra
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PackageCard;