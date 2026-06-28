import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  TextField,
  Collapse,
  Box,
  Alert,
  Divider,
} from "@mui/material";
import tourPackageService from "../services/tourPackage.service";
import reservationService from "../services/reservation.service";
import paymentService from "../services/payment.service";

const GROUP_DISCOUNT_THRESHOLD = 4;
const GROUP_DISCOUNT_RATE = 0.10;
const MAX_TOTAL_DISCOUNT_RATE = 0.20;

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return `$${new Intl.NumberFormat("es-CL").format(Math.round(numericValue))}`;
};

const buildEstimatedPriceBreakdown = (tourPackage, passengerCount) => {
  const numericPassengerCount = Number(passengerCount) || 0;
  const pricePerPassenger = Number(tourPackage?.price) || 0;
  const originalTotalAmount = pricePerPassenger * numericPassengerCount;
  const discounts = [];

  const promotionPercentage = Number(tourPackage?.promotionDiscountPercentage || 0);

  if (promotionPercentage > 0) {
    discounts.push({
      description: `Promoción del paquete (${promotionPercentage}%)`,
      rate: promotionPercentage / 100,
    });
  }

  if (numericPassengerCount >= GROUP_DISCOUNT_THRESHOLD) {
    discounts.push({
      description: "Descuento por grupo (10%)",
      rate: GROUP_DISCOUNT_RATE,
    });
  }

  const totalDiscountRate = discounts.reduce(
    (total, discount) => total + discount.rate,
    0
  );

  const limitedDiscountRate = Math.min(totalDiscountRate, MAX_TOTAL_DISCOUNT_RATE);
  const limitWasApplied = totalDiscountRate > MAX_TOTAL_DISCOUNT_RATE;

  const discountAmount = originalTotalAmount * limitedDiscountRate;
  const finalTotalAmount = Math.max(originalTotalAmount - discountAmount, 0);

  const visualDiscounts = discounts.map((discount) => ({
    description: discount.description,
    amount: originalTotalAmount * discount.rate,
  }));

  if (limitWasApplied) {
    visualDiscounts.push({
      description: "Límite máximo de descuentos aplicado (20%)",
      amount:
        visualDiscounts.reduce((total, discount) => total + discount.amount, 0) -
        discountAmount,
      isLimitAdjustment: true,
    });
  }

  return {
    pricePerPassenger,
    passengerCount: numericPassengerCount,
    originalTotalAmount,
    discounts: visualDiscounts,
    discountAmount,
    finalTotalAmount,
  };
};

const buildReservationPriceBreakdown = (reservation, tourPackage) => {
  if (!reservation) return null;

  const passengerCount = Number(reservation.passengerCount) || 0;
  const fallbackOriginalTotalAmount =
    (Number(tourPackage?.price) || 0) * passengerCount;

  const originalTotalAmount =
    Number(reservation.originalTotalAmount) || fallbackOriginalTotalAmount;

  const finalTotalAmount =
    Number(reservation.finalTotalAmount) || originalTotalAmount;

  const discountAmount = Math.max(
    Number(reservation.discountAmount) || originalTotalAmount - finalTotalAmount,
    0
  );

  const pricePerPassenger =
    passengerCount > 0
      ? originalTotalAmount / passengerCount
      : Number(tourPackage?.price) || 0;

  const hasDiscountDescription =
    reservation.discountDescription &&
    reservation.discountDescription !== "Sin descuento";

  return {
    pricePerPassenger,
    passengerCount,
    originalTotalAmount,
    discounts:
      discountAmount > 0
        ? [
            {
              description: hasDiscountDescription
                ? reservation.discountDescription
                : "Descuento aplicado",
              amount: discountAmount,
            },
          ]
        : [],
    discountAmount,
    finalTotalAmount,
  };
};

const PriceBreakdown = ({ title, breakdown, helperText }) => {
  if (!breakdown || breakdown.passengerCount <= 0) return null;

  const hasDiscounts = breakdown.discountAmount > 0;

  return (
    <Box
      sx={{
        border: "1px solid #cbd5e1",
        borderRadius: 2,
        backgroundColor: "#f8fafc",
        p: 2,
        textAlign: "left",
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#111827" }}>
          {title}
        </Typography>

        {helperText && (
          <Typography variant="body2" sx={{ color: "#475569" }}>
            {helperText}
          </Typography>
        )}

        <Divider />

        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Typography variant="body2">Precio por persona</Typography>
          <Typography variant="body2" fontWeight="bold">
            {formatCurrency(breakdown.pricePerPassenger)}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Typography variant="body2">Cantidad de pasajeros</Typography>
          <Typography variant="body2" fontWeight="bold">
            {breakdown.passengerCount}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Typography variant="body2">Subtotal original</Typography>
          <Typography variant="body2" fontWeight="bold">
            {formatCurrency(breakdown.originalTotalAmount)}
          </Typography>
        </Stack>

        <Divider />

        {hasDiscounts ? (
          <Stack spacing={0.75}>
            <Typography variant="body2" fontWeight="bold" sx={{ color: "#166534" }}>
              Descuentos aplicados
            </Typography>

            {breakdown.discounts.map((discount, index) => (
              <Stack
                key={`${discount.description}-${index}`}
                direction="row"
                justifyContent="space-between"
                spacing={2}
              >
                <Typography variant="body2">{discount.description}</Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: discount.isLimitAdjustment ? "#b45309" : "#166534" }}
                >
                  {discount.isLimitAdjustment
                    ? `+${formatCurrency(discount.amount)}`
                    : `-${formatCurrency(discount.amount)}`}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Sin descuentos aplicados.
          </Typography>
        )}

        <Divider />

        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Typography fontWeight="bold">Total a pagar</Typography>
          <Typography fontWeight="bold" sx={{ color: "#0f766e" }}>
            {formatCurrency(breakdown.finalTotalAmount)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

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

const formatCardNumberMask = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 16);

  if (!digits) return "";

  const masked = digits.padEnd(16, "_");

  return masked.match(/.{1,4}/g).join(" ");
};

const formatExpirationMask = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 4);

  if (!digits) return "";

  const masked = digits.padEnd(4, "_");

  return `${masked.slice(0, 2)}/${masked.slice(2, 4)}`;
};

const formatCvvMask = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 3);

  if (!digits) return "";

  return digits.padEnd(3, "_");
};

const getCardCursorPosition = (digitsLength) => {
  if (digitsLength <= 0) return 0;

  return digitsLength + Math.floor((digitsLength - 1) / 4);
};

const getExpirationCursorPosition = (digitsLength) => {
  if (digitsLength <= 2) return digitsLength;

  return digitsLength + 1;
};

const setInputCursorPosition = (inputRef, position) => {
  const input = inputRef.current;

  if (!input || document.activeElement !== input) return;

  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
};

const calculateTourEndDate = (startDate, durationDays) => {
  if (!startDate || !durationDays) return "";

  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + Number(durationDays));

  return date.toISOString().split("T")[0];
};

const formatRemainingTime = (seconds) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const parseBackendDateTimeAsUtc = (dateTimeValue) => {
  if (!dateTimeValue) return null;

  const dateTimeText = String(dateTimeValue);

  const hasTimezone =
    dateTimeText.endsWith("Z") ||
    /[+-]\d{2}:\d{2}$/.test(dateTimeText);

  return new Date(hasTimezone ? dateTimeText : `${dateTimeText}Z`).getTime();
};

const getStoredPaymentDeadline = (reservationId) => {
  if (!reservationId) return null;

  const savedDeadline = localStorage.getItem(`reservationPaymentDeadline-${reservationId}`);

  return savedDeadline ? Number(savedDeadline) : null;
};

const removeStoredPaymentDeadline = (reservationId) => {
  if (!reservationId) return;

  localStorage.removeItem(`reservationPaymentDeadline-${reservationId}`);
};

const getDeadlineFromReservation = (reservation) => {
  if (!reservation) return Date.now() + 60 * 1000;

  if (reservation.frontendPaymentDeadline) {
    return Number(reservation.frontendPaymentDeadline);
  }

  const storedDeadline = getStoredPaymentDeadline(reservation.id);

  if (storedDeadline) {
    return storedDeadline;
  }

  if (reservation.paymentDeadline) {
    return parseBackendDateTimeAsUtc(reservation.paymentDeadline);
  }

  if (reservation.reservationDate) {
    return parseBackendDateTimeAsUtc(reservation.reservationDate) + 60 * 1000;
  }

  return Date.now() + 60 * 1000;
};

function PackageDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tourPackage, setTourPackage] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [reservationStartDate, setReservationStartDate] = useState("");
  const [passengerCount, setPassengerCount] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiration, setCardExpiration] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [paymentExpired, setPaymentExpired] = useState(false);

  const expirationSyncRef = useRef(false);
  const cardNumberInputRef = useRef(null);
  const cardExpirationInputRef = useRef(null);
  const cardCvvInputRef = useRef(null);

  useEffect(() => {
    loadTourPackage();
  }, [id]);

  useEffect(() => {
    setInputCursorPosition(cardNumberInputRef, getCardCursorPosition(cardNumber.length));
  }, [cardNumber]);

  useEffect(() => {
    setInputCursorPosition(
      cardExpirationInputRef,
      getExpirationCursorPosition(cardExpiration.length)
    );
  }, [cardExpiration]);

  useEffect(() => {
    setInputCursorPosition(cardCvvInputRef, cardCvv.length);
  }, [cardCvv]);

  useEffect(() => {
    if (!createdReservation || !showPaymentForm) {
      setRemainingSeconds(null);
      setPaymentExpired(false);
      return;
    }

    if (createdReservation.status === "EXPIRED") {
      setRemainingSeconds(0);
      setPaymentExpired(true);
      removeStoredPaymentDeadline(createdReservation.id);
      return;
    }

    const deadlineTime = getDeadlineFromReservation(createdReservation);

    const updateCountdown = () => {
      const secondsLeft = Math.ceil((deadlineTime - Date.now()) / 1000);

      if (secondsLeft <= 0) {
        setRemainingSeconds(0);
        setPaymentExpired(true);

        if (!expirationSyncRef.current && createdReservation?.id) {
          expirationSyncRef.current = true;
          removeStoredPaymentDeadline(createdReservation.id);
          syncReservationExpiration(createdReservation.id);
        }

        return;
      }

      setRemainingSeconds(secondsLeft);
      setPaymentExpired(false);
    };

    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [createdReservation, showPaymentForm]);

  const loadTourPackage = async () => {
    try {
      const response = await tourPackageService.getTourPackageById(id);
      setTourPackage(response.data);
    } catch (error) {
      console.error("Error loading tour package:", error);
    }
  };

  const syncReservationExpiration = async (reservationId) => {
    try {
      const response = await reservationService.getReservationById(reservationId);

      if (response.data) {
        setCreatedReservation(response.data);

        if (response.data.status === "EXPIRED") {
          setPaymentExpired(true);
          removeStoredPaymentDeadline(response.data.id);
        }
      }

      await loadTourPackage();
    } catch (error) {
      console.error("Error syncing reservation expiration:", error);
    }
  };

  const isAccountInactive = () => {
    return localStorage.getItem("userAccountInactive") === "true";
  };

  const showUserAccessMessage = (message) => {
    if (isAccountInactive()) {
      alert("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
      return;
    }

    alert(message);
    navigate("/login");
  };

  const handleToggleReservationForm = () => {
    if (isAccountInactive()) {
      alert("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
      return;
    }

    const currentUserId = localStorage.getItem("userId");

    if (!currentUserId) {
      showUserAccessMessage("Debes iniciar sesión para reservar");
      return;
    }

    setShowReservationForm(!showReservationForm);
  };

  const handleConfirmReservation = async () => {
    if (isAccountInactive()) {
      alert("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
      return;
    }

    if (!reservationStartDate) {
      alert("Debes seleccionar la fecha de inicio del tour");
      return;
    }

    const packageStartDate = normalizeDateOnly(tourPackage.startDate);
    const packageEndDate = normalizeDateOnly(tourPackage.endDate);

    if (
      reservationStartDate < packageStartDate ||
      reservationStartDate > packageEndDate
    ) {
      alert("La fecha de inicio del tour debe estar dentro del periodo disponible del paquete");
      return;
    }

    if (!passengerCount || Number(passengerCount) <= 0) {
      alert("La cantidad de pasajeros debe ser mayor que cero");
      return;
    }

    const currentUserId = localStorage.getItem("userId");

    if (!currentUserId) {
      showUserAccessMessage("Debes registrarte o iniciar sesión antes de reservar");
      return;
    }

    const reservationData = {
      user: {
        id: Number(currentUserId),
      },
      tourPackage: {
        id: Number(tourPackage.id),
      },
      passengerCount: Number(passengerCount),
      specialRequests,
      tourStartDate: reservationStartDate,
      tourEndDate: calculatedEndDate,
    };

    try {
      const response = await reservationService.createReservation(reservationData);
      const frontendPaymentDeadline = Date.now() + 60 * 1000;

      if (response.data?.id) {
        localStorage.setItem(
          `reservationPaymentDeadline-${response.data.id}`,
          String(frontendPaymentDeadline)
        );
      }

      setCreatedReservation({
        ...response.data,
        frontendPaymentDeadline,
      });

      setShowPaymentForm(true);
      setPaymentExpired(false);
      expirationSyncRef.current = false;

      alert("Reserva creada correctamente. Tienes 1 minuto para realizar el pago.");

      setShowReservationForm(false);
      setReservationStartDate("");
      setPassengerCount("");
      setSpecialRequests("");

      await loadTourPackage();
    } catch (error) {
      console.error("Error creating reservation:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Ocurrió un error al crear la reserva";

      alert(backendMessage);
    }
  };

  const handleConfirmPayment = async () => {
    if (isAccountInactive()) {
      alert("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
      return;
    }

    if (paymentExpired) {
      if (createdReservation?.id) {
        removeStoredPaymentDeadline(createdReservation.id);
        await syncReservationExpiration(createdReservation.id);
      }

      alert("La reserva expiró por falta de pago. Los cupos fueron liberados.");
      setShowPaymentForm(false);
      setCreatedReservation(null);
      setRemainingSeconds(null);
      setPaymentExpired(false);
      expirationSyncRef.current = false;
      await loadTourPackage();
      return;
    }

    const currentUserId = localStorage.getItem("userId");

    if (!currentUserId) {
      showUserAccessMessage("Debes iniciar sesión para realizar el pago");
      return;
    }

    if (!createdReservation) {
      alert("No existe una reserva creada para pagar");
      return;
    }

    if (!cardNumber || !cardExpiration || !cardCvv) {
      alert("Debes completar todos los datos de la tarjeta");
      return;
    }

    const normalizedCardNumber = cardNumber;
    const normalizedCardExpiration = `${cardExpiration.slice(0, 2)}/${cardExpiration.slice(2, 4)}`;
    const normalizedCardCvv = cardCvv;

    if (!/^\d{16}$/.test(normalizedCardNumber)) {
      alert("El número de tarjeta debe tener 16 dígitos");
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(normalizedCardExpiration)) {
      alert("La fecha de expiración debe tener formato MM/AA");
      return;
    }

    if (!/^\d{3}$/.test(normalizedCardCvv)) {
      alert("El CVV debe tener 3 dígitos");
      return;
    }

    const paymentData = {
      reservation: {
        id: createdReservation.id,
      },
      amount: createdReservation.finalTotalAmount,
      cardNumber: normalizedCardNumber,
      cardExpiration: normalizedCardExpiration,
      cardCvv: normalizedCardCvv,
    };

    try {
      await paymentService.createPayment(paymentData);

      removeStoredPaymentDeadline(createdReservation.id);

      alert("Pago realizado correctamente");

      setShowPaymentForm(false);
      setCreatedReservation(null);
      setRemainingSeconds(null);
      setPaymentExpired(false);
      expirationSyncRef.current = false;
      setCardNumber("");
      setCardExpiration("");
      setCardCvv("");

      await loadTourPackage();
    } catch (error) {
      console.error("Error creating payment:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (typeof error.response?.data === "string" ? error.response.data : null) ||
        "Ocurrió un error al realizar el pago";

      if (backendMessage.toLowerCase().includes("expirada")) {
        setPaymentExpired(true);

        if (createdReservation?.id) {
          removeStoredPaymentDeadline(createdReservation.id);
          await syncReservationExpiration(createdReservation.id);
        }
      }

      alert(backendMessage);
    }
  };

  if (!tourPackage) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4">Cargando detalle del paquete...</Typography>
      </Container>
    );
  }

  const promotionPercentage = Number(tourPackage?.promotionDiscountPercentage || 0);
  const hasPromotion = promotionPercentage > 0;

  const calculatedEndDate = calculateTourEndDate(
    reservationStartDate,
    tourPackage.durationDays
  );

  const estimatedPriceBreakdown = buildEstimatedPriceBreakdown(
    tourPackage,
    passengerCount
  );

  const paymentPriceBreakdown = buildReservationPriceBreakdown(
    createdReservation,
    tourPackage
  );

  return (
    <Container sx={{ py: 4 }}>
      <Card sx={{ maxWidth: 700, mx: "auto", borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#111827" }}>
              {tourPackage.name}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={getStatusLabel(tourPackage.status)}
                color={tourPackage.status === "AVAILABLE" ? "success" : "default"}
                sx={{ width: "fit-content" }}
              />

              {hasPromotion && (
                <Chip
                  label={`Promoción por tiempo limitado - ${promotionPercentage}% OFF`}
                  color="warning"
                  sx={{ width: "fit-content", fontWeight: "bold" }}
                />
              )}
            </Stack>

            <Typography>
              <strong>Destino:</strong> {tourPackage.destination}
            </Typography>

            <Typography>
              <strong>Precio:</strong> {formatCurrency(tourPackage.price)}
            </Typography>

            <Typography>
              <strong>Promoción:</strong>{" "}
              {hasPromotion ? `${promotionPercentage}% OFF` : "Sin promoción"}
            </Typography>

            <Typography>
              <strong>Disponible desde:</strong> {formatDateOnly(tourPackage.startDate)}
            </Typography>

            <Typography>
              <strong>Disponible hasta:</strong> {formatDateOnly(tourPackage.endDate)}
            </Typography>

            <Typography>
              <strong>Duración:</strong> {tourPackage.durationDays} día(s)
            </Typography>

            <Typography>
              <strong>Cupos disponibles:</strong> {tourPackage.availableQuota}
            </Typography>

            <Typography>
              <strong>Descripción:</strong> {tourPackage.description}
            </Typography>

            <Typography>
              <strong>Tipo de viaje:</strong> {tourPackage.travelType}
            </Typography>

            <Typography>
              <strong>Temporada:</strong> {tourPackage.season}
            </Typography>

            <Typography>
              <strong>Categoría:</strong> {tourPackage.category}
            </Typography>

            <Typography>
              <strong>Servicios incluidos:</strong> {tourPackage.includedServices}
            </Typography>

            <Typography>
              <strong>Condiciones:</strong> {tourPackage.conditions}
            </Typography>

            <Typography>
              <strong>Restricciones:</strong> {tourPackage.restrictions}
            </Typography>

            <Button variant="contained" onClick={handleToggleReservationForm}>
              {showReservationForm ? "Ocultar reserva" : "Reservar"}
            </Button>

            <Collapse in={showReservationForm}>
              <Box sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Datos de la reserva
                  </Typography>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, textAlign: "left" }}>
                      Fecha de inicio del tour
                    </Typography>
                    <TextField
                      type="date"
                      value={reservationStartDate}
                      onChange={(event) => setReservationStartDate(event.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{
                        min: normalizeDateOnly(tourPackage.startDate),
                        max: normalizeDateOnly(tourPackage.endDate),
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, textAlign: "left" }}>
                      Fecha de término del tour
                    </Typography>
                    <TextField
                      type="date"
                      value={calculatedEndDate}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Box>

                  <TextField
                    label="Cantidad de pasajeros"
                    type="number"
                    value={passengerCount}
                    onChange={(event) => setPassengerCount(event.target.value)}
                    fullWidth
                  />

                  <PriceBreakdown
                    title="Resumen estimado de la reserva"
                    breakdown={estimatedPriceBreakdown}
                    helperText={
                      estimatedPriceBreakdown.discountAmount > 0
                        ? "El sistema aplicará automáticamente los descuentos visibles antes de confirmar la reserva."
                        : `Con ${GROUP_DISCOUNT_THRESHOLD} o más pasajeros se aplica un descuento automático por grupo.`
                    }
                  />

                  <TextField
                    label="Solicitudes especiales"
                    multiline
                    rows={4}
                    value={specialRequests}
                    onChange={(event) => setSpecialRequests(event.target.value)}
                    fullWidth
                  />

                  <Button variant="contained" onClick={handleConfirmReservation}>
                    Confirmar reserva
                  </Button>
                </Stack>
              </Box>
            </Collapse>

            <Collapse in={showPaymentForm}>
              <Box sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Datos del pago
                  </Typography>

                  {remainingSeconds !== null && !paymentExpired && (
                    <Alert severity="info">
                      Tiempo restante para pagar:{" "}
                      <strong>{formatRemainingTime(remainingSeconds)}</strong>
                    </Alert>
                  )}

                  {paymentExpired && (
                    <Alert severity="warning">
                      La reserva expiró por falta de pago. Los cupos fueron liberados.
                    </Alert>
                  )}

                  <PriceBreakdown
                    title="Resumen final de la reserva"
                    breakdown={paymentPriceBreakdown}
                    helperText="Este es el monto registrado por el sistema antes de confirmar el pago."
                  />

                  <TextField
                    label="Número de tarjeta"
                    placeholder="____ ____ ____ ____"
                    value={formatCardNumberMask(cardNumber)}
                    onChange={(event) =>
                      setCardNumber(event.target.value.replace(/\D/g, "").slice(0, 16))
                    }
                    inputRef={cardNumberInputRef}
                    fullWidth
                    disabled={paymentExpired}
                    inputProps={{
                      inputMode: "numeric",
                      style: {
                        fontFamily: "monospace",
                        letterSpacing: "0.08em",
                      },
                    }}
                  />

                  <TextField
                    label="Fecha de expiración"
                    placeholder="__/__"
                    value={formatExpirationMask(cardExpiration)}
                    onChange={(event) =>
                      setCardExpiration(event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    inputRef={cardExpirationInputRef}
                    fullWidth
                    disabled={paymentExpired}
                    inputProps={{
                      inputMode: "numeric",
                      style: {
                        fontFamily: "monospace",
                        letterSpacing: "0.08em",
                      },
                    }}
                  />

                  <TextField
                    label="CVV"
                    placeholder="___"
                    value={formatCvvMask(cardCvv)}
                    onChange={(event) =>
                      setCardCvv(event.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    inputRef={cardCvvInputRef}
                    fullWidth
                    disabled={paymentExpired}
                    inputProps={{
                      inputMode: "numeric",
                      style: {
                        fontFamily: "monospace",
                        letterSpacing: "0.08em",
                      },
                    }}
                  />

                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleConfirmPayment}
                    disabled={paymentExpired}
                  >
                    Confirmar pago
                  </Button>
                </Stack>
              </Box>
            </Collapse>

            <Button variant="outlined" component={Link} to="/">
              Volver a paquetes
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default PackageDetailPage;