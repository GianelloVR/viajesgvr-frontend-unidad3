import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import reservationService from "../services/reservation.service";
import paymentService from "../services/payment.service";

const CART_STORAGE_KEY = "multiPackageCart";
const GROUP_PAYMENT_DEADLINE_STORAGE_PREFIX = "purchaseGroupPaymentDeadline-";
const GROUP_DISCOUNT_THRESHOLD = 4;
const GROUP_DISCOUNT_RATE = 0.1;
const MULTIPLE_PACKAGE_DISCOUNT_RATE = 0.05;
const MAX_TOTAL_DISCOUNT_RATE = 0.2;

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return `$${new Intl.NumberFormat("es-CL").format(Math.round(numericValue))}`;
};

const calculateTourEndDate = (startDate, durationDays) => {
  if (!startDate || !durationDays) return "";

  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + Number(durationDays));

  return date.toISOString().split("T")[0];
};

const parseBackendDateTimeAsUtc = (dateTimeValue) => {
  if (!dateTimeValue) return null;

  const dateTimeText = String(dateTimeValue);
  const hasTimezone =
    dateTimeText.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateTimeText);

  return new Date(hasTimezone ? dateTimeText : `${dateTimeText}Z`).getTime();
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

const getStoredGroupPaymentDeadline = (purchaseGroupCode) => {
  if (!purchaseGroupCode) return null;

  const savedDeadline = localStorage.getItem(
    `${GROUP_PAYMENT_DEADLINE_STORAGE_PREFIX}${purchaseGroupCode}`
  );

  return savedDeadline ? Number(savedDeadline) : null;
};

const saveStoredGroupPaymentDeadline = (purchaseGroupCode, deadline) => {
  if (!purchaseGroupCode || !deadline) return;

  localStorage.setItem(
    `${GROUP_PAYMENT_DEADLINE_STORAGE_PREFIX}${purchaseGroupCode}`,
    String(deadline)
  );
};

const removeStoredGroupPaymentDeadline = (purchaseGroupCode) => {
  if (!purchaseGroupCode) return;

  localStorage.removeItem(
    `${GROUP_PAYMENT_DEADLINE_STORAGE_PREFIX}${purchaseGroupCode}`
  );
};

const getDeadlineFromReservations = (reservations) => {
  if (!reservations || reservations.length === 0) {
    return Date.now() + 60 * 1000;
  }

  const firstReservation = reservations[0];

  if (firstReservation.frontendPaymentDeadline) {
    return Number(firstReservation.frontendPaymentDeadline);
  }

  const storedDeadline = getStoredGroupPaymentDeadline(
    firstReservation.purchaseGroupCode
  );

  if (storedDeadline) {
    return storedDeadline;
  }

  if (firstReservation.paymentDeadline) {
    return parseBackendDateTimeAsUtc(firstReservation.paymentDeadline);
  }

  if (firstReservation.reservationDate) {
    return parseBackendDateTimeAsUtc(firstReservation.reservationDate) + 60 * 1000;
  }

  return Date.now() + 60 * 1000;
};

const formatRemainingTime = (seconds) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
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

const buildEstimatedItemBreakdown = (item, isMultiplePurchase) => {
  const passengerCount = Number(item.passengerCount) || 0;
  const pricePerPassenger = Number(item.price) || 0;
  const originalTotalAmount = pricePerPassenger * passengerCount;
  const discounts = [];

  const promotionPercentage = Number(item.promotionDiscountPercentage || 0);

  if (promotionPercentage > 0) {
    discounts.push({
      description: `Promoción del paquete (${promotionPercentage}%)`,
      rate: promotionPercentage / 100,
    });
  }

  if (passengerCount >= GROUP_DISCOUNT_THRESHOLD) {
    discounts.push({
      description: "Descuento por grupo (10%)",
      rate: GROUP_DISCOUNT_RATE,
    });
  }

  if (isMultiplePurchase) {
    discounts.push({
      description: "Descuento por compra múltiple (5%)",
      rate: MULTIPLE_PACKAGE_DISCOUNT_RATE,
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

  return {
    pricePerPassenger,
    passengerCount,
    originalTotalAmount,
    discounts,
    limitWasApplied,
    discountAmount,
    finalTotalAmount,
  };
};

const buildBackendReservationBreakdown = (reservation) => {
  if (!reservation) return null;

  return {
    originalTotalAmount: Number(reservation.originalTotalAmount) || 0,
    discountAmount: Number(reservation.discountAmount) || 0,
    finalTotalAmount: Number(reservation.finalTotalAmount) || 0,
    discountDescription: reservation.discountDescription || "Sin descuento",
  };
};

function CartPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [createdReservations, setCreatedReservations] = useState([]);
  const [purchaseGroupCode, setPurchaseGroupCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiration, setCardExpiration] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const expirationSyncRef = useRef(false);
  const cardNumberInputRef = useRef(null);
  const cardExpirationInputRef = useRef(null);
  const cardCvvInputRef = useRef(null);

  useEffect(() => {
    setCartItems(readCartItems());
  }, []);

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
    if (!createdReservations || createdReservations.length === 0) {
      setRemainingSeconds(null);
      setPaymentExpired(false);
      return;
    }

    const deadlineTime = getDeadlineFromReservations(createdReservations);

    const updateCountdown = () => {
      const secondsLeft = Math.ceil((deadlineTime - Date.now()) / 1000);

      if (secondsLeft <= 0) {
        setRemainingSeconds(0);
        setPaymentExpired(true);

        if (!expirationSyncRef.current && purchaseGroupCode) {
          expirationSyncRef.current = true;
          removeStoredGroupPaymentDeadline(purchaseGroupCode);
          syncGroupReservations(purchaseGroupCode);
        }

        return;
      }

      setRemainingSeconds(secondsLeft);
      setPaymentExpired(false);
    };

    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [createdReservations, purchaseGroupCode]);

  const isMultiplePurchase = cartItems.length >= 2;

  const estimatedBreakdowns = useMemo(() => {
    return cartItems.map((item) => ({
      itemId: item.id,
      breakdown: buildEstimatedItemBreakdown(item, isMultiplePurchase),
    }));
  }, [cartItems, isMultiplePurchase]);

  const estimatedTotal = useMemo(() => {
    return estimatedBreakdowns.reduce(
      (total, item) => total + item.breakdown.finalTotalAmount,
      0
    );
  }, [estimatedBreakdowns]);

  const backendTotal = useMemo(() => {
    return createdReservations.reduce(
      (total, reservation) => total + Number(reservation.finalTotalAmount || 0),
      0
    );
  }, [createdReservations]);

  const isAccountInactive = () => {
    return localStorage.getItem("userAccountInactive") === "true";
  };

  const updateCartItems = (items) => {
    setCartItems(items);
    saveCartItems(items);
  };

  const handleRemoveItem = (packageId) => {
    const updatedItems = cartItems.filter(
      (item) => Number(item.id) !== Number(packageId)
    );

    updateCartItems(updatedItems);
  };

  const handleClearCart = () => {
    removeStoredGroupPaymentDeadline(purchaseGroupCode);

    updateCartItems([]);
    setCreatedReservations([]);
    setPurchaseGroupCode("");
    setRemainingSeconds(null);
    setPaymentExpired(false);
    setCardNumber("");
    setCardExpiration("");
    setCardCvv("");
    expirationSyncRef.current = false;
  };

  const handleItemChange = (packageId, field, value) => {
    const updatedItems = cartItems.map((item) => {
      if (Number(item.id) !== Number(packageId)) {
        return item;
      }

      const updatedItem = {
        ...item,
        [field]: value,
      };

      if (field === "tourStartDate") {
        updatedItem.tourEndDate = calculateTourEndDate(
          value,
          updatedItem.durationDays
        );
      }

      return updatedItem;
    });

    updateCartItems(updatedItems);
  };

  const validateCart = () => {
    if (isAccountInactive()) {
      alert("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
      return false;
    }

    if (cartItems.length < 2) {
      alert("Debes agregar al menos dos paquetes para realizar una compra múltiple.");
      return false;
    }

    const currentUserId = localStorage.getItem("userId");

    if (!currentUserId) {
      alert("Debes iniciar sesión para confirmar la compra.");
      navigate("/login");
      return false;
    }

    for (const item of cartItems) {
      if (item.status !== "AVAILABLE") {
        alert(`El paquete ${item.name} no está disponible.`);
        return false;
      }

      if (!item.tourStartDate) {
        alert(`Debes seleccionar fecha de inicio para ${item.name}.`);
        return false;
      }

      if (item.tourStartDate < item.startDate || item.tourStartDate > item.endDate) {
        alert(`La fecha de inicio de ${item.name} debe estar dentro de la vigencia del paquete.`);
        return false;
      }

      if (!item.passengerCount || Number(item.passengerCount) <= 0) {
        alert(`La cantidad de pasajeros de ${item.name} debe ser mayor que cero.`);
        return false;
      }

      if (Number(item.passengerCount) > Number(item.availableQuota || 0)) {
        alert(`La cantidad de pasajeros de ${item.name} supera los cupos disponibles.`);
        return false;
      }
    }

    return true;
  };

  const handleConfirmMultiplePurchase = async () => {
    if (!validateCart()) return;

    const currentUserId = localStorage.getItem("userId");

    const reservationsData = cartItems.map((item) => ({
      user: {
        id: Number(currentUserId),
      },
      tourPackage: {
        id: Number(item.id),
      },
      passengerCount: Number(item.passengerCount),
      specialRequests: item.specialRequests || "",
      tourStartDate: item.tourStartDate,
      tourEndDate: item.tourEndDate,
    }));

    try {
      setIsLoading(true);

      const response = await reservationService.createMultipleReservations(
        reservationsData
      );

      const reservations = response.data || [];
      const groupCode = reservations[0]?.purchaseGroupCode || "";
      const frontendPaymentDeadline = Date.now() + 60 * 1000;

      if (groupCode) {
        saveStoredGroupPaymentDeadline(groupCode, frontendPaymentDeadline);
      }

      const reservationsWithFrontendDeadline = reservations.map((reservation) => ({
        ...reservation,
        frontendPaymentDeadline,
      }));

      setCreatedReservations(reservationsWithFrontendDeadline);
      setPurchaseGroupCode(groupCode);
      setRemainingSeconds(60);
      setPaymentExpired(false);
      expirationSyncRef.current = false;

      alert("Compra múltiple creada correctamente. Tienes 1 minuto para realizar el pago.");
    } catch (error) {
      console.error("Error creating multiple purchase:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (typeof error.response?.data === "string" ? error.response.data : null) ||
        "Ocurrió un error al crear la compra múltiple";

      alert(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const syncGroupReservations = async (groupCode) => {
    try {
      const response = await reservationService.getReservationsByPurchaseGroupCode(
        groupCode
      );

      if (response.data) {
        const reservations = response.data;

        setCreatedReservations(reservations);

        const hasExpiredReservation = reservations.some(
          (reservation) => reservation.status === "EXPIRED"
        );

        if (hasExpiredReservation) {
          setPaymentExpired(true);
          removeStoredGroupPaymentDeadline(groupCode);
        }
      }
    } catch (error) {
      console.error("Error syncing group reservations:", error);
    }
  };

  const handleConfirmGroupPayment = async () => {
    if (isAccountInactive()) {
      alert("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
      return;
    }

    if (paymentExpired) {
      alert("La compra expiró por falta de pago. Los cupos fueron liberados.");
      removeStoredGroupPaymentDeadline(purchaseGroupCode);
      setCreatedReservations([]);
      setPurchaseGroupCode("");
      setRemainingSeconds(null);
      setPaymentExpired(false);
      return;
    }

    if (!purchaseGroupCode || createdReservations.length === 0) {
      alert("No existe una compra múltiple creada para pagar.");
      return;
    }

    if (!cardNumber || !cardExpiration || !cardCvv) {
      alert("Debes completar todos los datos de la tarjeta.");
      return;
    }

    const normalizedCardNumber = cardNumber;
    const normalizedCardExpiration = `${cardExpiration.slice(0, 2)}/${cardExpiration.slice(2, 4)}`;
    const normalizedCardCvv = cardCvv;

    if (!/^\d{16}$/.test(normalizedCardNumber)) {
      alert("El número de tarjeta debe tener 16 dígitos.");
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(normalizedCardExpiration)) {
      alert("La fecha de expiración debe tener formato MM/AA.");
      return;
    }

    if (!/^\d{3}$/.test(normalizedCardCvv)) {
      alert("El CVV debe tener 3 dígitos.");
      return;
    }

    const paymentData = {
      amount: backendTotal,
      cardNumber: normalizedCardNumber,
      cardExpiration: normalizedCardExpiration,
      cardCvv: normalizedCardCvv,
    };

    try {
      setIsLoading(true);

      await paymentService.createPurchaseGroupPayment(
        purchaseGroupCode,
        paymentData
      );

      removeStoredGroupPaymentDeadline(purchaseGroupCode);

      alert("Pago de compra múltiple realizado correctamente.");

      handleClearCart();
      navigate("/my-reservations");
    } catch (error) {
      console.error("Error creating group payment:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (typeof error.response?.data === "string" ? error.response.data : null) ||
        "Ocurrió un error al realizar el pago de la compra múltiple";

      if (backendMessage.toLowerCase().includes("expirada")) {
        setPaymentExpired(true);
        removeStoredGroupPaymentDeadline(purchaseGroupCode);

        if (purchaseGroupCode) {
          await syncGroupReservations(purchaseGroupCode);
        }
      }

      alert(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEstimatedDiscounts = (breakdown) => {
    if (breakdown.discounts.length === 0) {
      return (
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Sin descuentos visibles antes de confirmar.
        </Typography>
      );
    }

    return (
      <Stack spacing={0.5}>
        {breakdown.discounts.map((discount, index) => (
          <Stack
            key={`${discount.description}-${index}`}
            direction="row"
            justifyContent="space-between"
            spacing={2}
          >
            <Typography variant="body2">{discount.description}</Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ color: "#166534" }}>
              -{formatCurrency(breakdown.originalTotalAmount * discount.rate)}
            </Typography>
          </Stack>
        ))}

        {breakdown.limitWasApplied && (
          <Typography variant="body2" sx={{ color: "#b45309" }}>
            Se aplicará límite máximo de descuentos de 20%.
          </Typography>
        )}
      </Stack>
    );
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Mi compra
      </Typography>

      <Stack spacing={3}>
        <Alert severity="info">
          Agrega dos o más paquetes para realizar una compra múltiple. El sistema
          aplicará el descuento por compra múltiple y luego confirmará el total real
          antes del pago.
        </Alert>

        {cartItems.length === 0 ? (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <Typography variant="h6" sx={{ color: "#111827" }}>
                  No tienes paquetes agregados a tu compra.
                </Typography>

                <Button variant="contained" component={Link} to="/">
                  Ver paquetes
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <>
            <Stack spacing={2}>
              {cartItems.map((item) => {
                const itemBreakdown = estimatedBreakdowns.find(
                  (breakdownItem) => Number(breakdownItem.itemId) === Number(item.id)
                )?.breakdown;

                return (
                  <Card key={item.id} sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: "#111827" }}>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#475569" }}>
                              Destino: {item.destination}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label="Disponible" color="success" size="small" />
                            {Number(item.promotionDiscountPercentage || 0) > 0 && (
                              <Chip
                                label={`Promo ${item.promotionDiscountPercentage}% OFF`}
                                color="warning"
                                size="small"
                              />
                            )}
                          </Stack>
                        </Stack>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                            gap: 2,
                          }}
                        >
                          <TextField
                            label="Fecha de inicio del tour"
                            type="date"
                            value={item.tourStartDate || ""}
                            onChange={(event) =>
                              handleItemChange(item.id, "tourStartDate", event.target.value)
                            }
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled={createdReservations.length > 0}
                          />

                          <TextField
                            label="Fecha de término del tour"
                            type="date"
                            value={item.tourEndDate || ""}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled
                          />

                          <TextField
                            label="Cantidad de pasajeros"
                            type="number"
                            value={item.passengerCount}
                            onChange={(event) =>
                              handleItemChange(item.id, "passengerCount", event.target.value)
                            }
                            fullWidth
                            disabled={createdReservations.length > 0}
                          />
                        </Box>

                        <TextField
                          label="Solicitudes especiales"
                          value={item.specialRequests || ""}
                          onChange={(event) =>
                            handleItemChange(item.id, "specialRequests", event.target.value)
                          }
                          multiline
                          rows={2}
                          fullWidth
                          disabled={createdReservations.length > 0}
                        />

                        {itemBreakdown && (
                          <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 2, p: 2 }}>
                            <Stack spacing={1}>
                              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#111827" }}>
                                Resumen estimado
                              </Typography>

                              <Divider />

                              <Stack direction="row" justifyContent="space-between" spacing={2}>
                                <Typography variant="body2">Precio por persona</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(itemBreakdown.pricePerPassenger)}
                                </Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between" spacing={2}>
                                <Typography variant="body2">Subtotal original</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(itemBreakdown.originalTotalAmount)}
                                </Typography>
                              </Stack>

                              <Divider />
                              {renderEstimatedDiscounts(itemBreakdown)}
                              <Divider />

                              <Stack direction="row" justifyContent="space-between" spacing={2}>
                                <Typography fontWeight="bold">Total estimado</Typography>
                                <Typography fontWeight="bold" sx={{ color: "#0f766e" }}>
                                  {formatCurrency(itemBreakdown.finalTotalAmount)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        )}

                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={createdReservations.length > 0}
                        >
                          Quitar paquete
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>

            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "#111827" }}>
                    Resumen de compra múltiple
                  </Typography>

                  {!isMultiplePurchase && (
                    <Alert severity="warning">
                      Agrega al menos otro paquete para activar la compra múltiple.
                    </Alert>
                  )}

                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography>Paquetes seleccionados</Typography>
                    <Typography fontWeight="bold">{cartItems.length}</Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography>Total estimado</Typography>
                    <Typography fontWeight="bold" sx={{ color: "#0f766e" }}>
                      {formatCurrency(estimatedTotal)}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    El descuento por cliente frecuente se calcula al confirmar la compra,
                    porque depende del historial real del cliente en el backend.
                  </Typography>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Button
                      variant="contained"
                      onClick={handleConfirmMultiplePurchase}
                      disabled={isLoading || createdReservations.length > 0}
                    >
                      Confirmar compra múltiple
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleClearCart}
                      disabled={isLoading}
                    >
                      Vaciar compra
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}

        {createdReservations.length > 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: "#111827" }}>
                  Pago de compra múltiple
                </Typography>

                <Alert severity="success">
                  Compra creada correctamente. Código de grupo: {purchaseGroupCode}
                </Alert>

                {remainingSeconds !== null && !paymentExpired && (
                  <Alert severity="info">
                    Tiempo restante para pagar: <strong>{formatRemainingTime(remainingSeconds)}</strong>
                  </Alert>
                )}

                {paymentExpired && (
                  <Alert severity="warning">
                    La compra expiró por falta de pago. Los cupos fueron liberados.
                  </Alert>
                )}

                <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 2, p: 2 }}>
                  <Stack spacing={1.25}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#111827" }}>
                      Resumen final registrado por el sistema
                    </Typography>

                    <Divider />

                    {createdReservations.map((reservation) => {
                      const breakdown = buildBackendReservationBreakdown(reservation);

                      return (
                        <Box key={reservation.id}>
                          <Stack spacing={0.75}>
                            <Typography variant="body2" fontWeight="bold">
                              Reserva #{reservation.id} - {reservation.tourPackage?.name}
                            </Typography>
                            <Stack direction="row" justifyContent="space-between" spacing={2}>
                              <Typography variant="body2">Subtotal original</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(breakdown.originalTotalAmount)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" spacing={2}>
                              <Typography variant="body2">Descuentos aplicados</Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: "#166534" }}>
                                -{formatCurrency(breakdown.discountAmount)}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: "#475569" }}>
                              {breakdown.discountDescription}
                            </Typography>
                            <Stack direction="row" justifyContent="space-between" spacing={2}>
                              <Typography variant="body2">Total paquete</Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: "#0f766e" }}>
                                {formatCurrency(breakdown.finalTotalAmount)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Divider sx={{ my: 1.5 }} />
                        </Box>
                      );
                    })}

                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography fontWeight="bold">Total a pagar</Typography>
                      <Typography fontWeight="bold" sx={{ color: "#0f766e" }}>
                        {formatCurrency(backendTotal)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                <TextField
                  label="Número de tarjeta"
                  placeholder="____ ____ ____ ____"
                  value={formatCardNumberMask(cardNumber)}
                  onChange={(event) =>
                    setCardNumber(event.target.value.replace(/\D/g, "").slice(0, 16))
                  }
                  inputRef={cardNumberInputRef}
                  fullWidth
                  disabled={paymentExpired || isLoading}
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
                  disabled={paymentExpired || isLoading}
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
                  disabled={paymentExpired || isLoading}
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
                  onClick={handleConfirmGroupPayment}
                  disabled={paymentExpired || isLoading}
                >
                  Confirmar pago de compra múltiple
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}

export default CartPage;