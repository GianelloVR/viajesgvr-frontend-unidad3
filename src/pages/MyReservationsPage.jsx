import { useEffect, useState } from "react";
import {
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    Button,
    Collapse,
    Box,
    TextField,
    Alert,
    Divider,
} from "@mui/material";
import reservationService from "../services/reservation.service";
import paymentService from "../services/payment.service";

const GROUP_PAYMENT_DEADLINE_STORAGE_PREFIX = "purchaseGroupPaymentDeadline-";

const formatCurrency = (value) => {
    const numericValue = Number(value) || 0;
    return `$${new Intl.NumberFormat("es-CL").format(Math.round(numericValue))}`;
};

const buildReservationPriceBreakdown = (reservation) => {
    if (!reservation) return null;

    const passengerCount = Number(reservation.passengerCount) || 0;
    const packagePrice = Number(reservation.tourPackage?.price) || 0;
    const fallbackOriginalTotalAmount = packagePrice * passengerCount;
    const originalTotalAmount =
        Number(reservation.originalTotalAmount) || fallbackOriginalTotalAmount;
    const finalTotalAmount =
        Number(reservation.finalTotalAmount) || originalTotalAmount;
    const discountAmount = Math.max(
        Number(reservation.discountAmount) || originalTotalAmount - finalTotalAmount,
        0
    );
    const pricePerPassenger = passengerCount > 0
        ? originalTotalAmount / passengerCount
        : packagePrice;

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

const PriceBreakdown = ({ title, breakdown }) => {
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
                                <Typography variant="body2" fontWeight="bold" sx={{ color: "#166534" }}>
                                    -{formatCurrency(discount.amount)}
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
                    <Typography fontWeight="bold">Monto final</Typography>
                    <Typography fontWeight="bold" sx={{ color: "#0f766e" }}>
                        {formatCurrency(breakdown.finalTotalAmount)}
                    </Typography>
                </Stack>
            </Stack>
        </Box>
    );
};

const parseBackendDateTime = (dateTimeValue) => {
    if (!dateTimeValue) return null;

    const dateTimeText = String(dateTimeValue);
    return new Date(dateTimeText).getTime();
};

const formatBackendDateTime = (dateTimeValue) => {
    if (!dateTimeValue) return "No registrada";

    return new Date(dateTimeValue).toLocaleString("es-CL");
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

const getStoredGroupPaymentDeadline = (purchaseGroupCode) => {
    if (!purchaseGroupCode) return null;

    const savedDeadline = localStorage.getItem(
        `${GROUP_PAYMENT_DEADLINE_STORAGE_PREFIX}${purchaseGroupCode}`
    );

    return savedDeadline ? Number(savedDeadline) : null;
};

const removeStoredGroupPaymentDeadline = (purchaseGroupCode) => {
    if (!purchaseGroupCode) return;

    localStorage.removeItem(
        `${GROUP_PAYMENT_DEADLINE_STORAGE_PREFIX}${purchaseGroupCode}`
    );
};

const removeStoredDeadlines = (reservation) => {
    if (!reservation) return;

    removeStoredPaymentDeadline(reservation.id);
    removeStoredGroupPaymentDeadline(reservation.purchaseGroupCode);
};

const getPaymentDeadlineTime = (reservation) => {
    if (!reservation) return null;

    const storedReservationDeadline = getStoredPaymentDeadline(reservation.id);

    if (storedReservationDeadline) {
        return storedReservationDeadline;
    }

    const storedGroupDeadline = getStoredGroupPaymentDeadline(reservation.purchaseGroupCode);

    if (storedGroupDeadline) {
        return storedGroupDeadline;
    }

    if (reservation.paymentDeadline) {
        return parseBackendDateTime(reservation.paymentDeadline);
    }

    if (reservation.reservationDate) {
        return parseBackendDateTime(reservation.reservationDate) + 60 * 1000;
    }

    return null;
};

const getRemainingSeconds = (reservation, currentTime) => {
    const deadlineTime = getPaymentDeadlineTime(reservation);

    if (!deadlineTime) return null;

    return Math.max(Math.ceil((deadlineTime - currentTime) / 1000), 0);
};

const formatRemainingTime = (seconds) => {
    const safeSeconds = Math.max(seconds || 0, 0);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const isReservationExpiredForUi = (reservation, currentTime) => {
    if (reservation.status === "EXPIRED") {
        removeStoredDeadlines(reservation);
        return true;
    }

    if (reservation.status !== "PENDING_PAYMENT") {
        removeStoredDeadlines(reservation);
        return false;
    }

    const remainingSeconds = getRemainingSeconds(reservation, currentTime);

    if (remainingSeconds !== null && remainingSeconds <= 0) {
        removeStoredDeadlines(reservation);
        return true;
    }

    return false;
};

const getStatusLabel = (status) => {
    switch (status) {
        case "PENDING_PAYMENT":
            return "Pendiente de pago";
        case "CONFIRMED":
            return "Confirmada";
        case "CANCELED":
            return "Cancelada";
        case "EXPIRED":
            return "Expirada";
        default:
            return status;
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case "PENDING_PAYMENT":
            return "warning";
        case "CONFIRMED":
            return "success";
        case "CANCELED":
            return "error";
        case "EXPIRED":
            return "default";
        default:
            return "default";
    }
};

function MyReservationsPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(Date.now());

    const [paymentReservationId, setPaymentReservationId] = useState(null);
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiration, setCardExpiration] = useState("");
    const [cardCvv, setCardCvv] = useState("");

    useEffect(() => {
        loadReservations();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const loadReservations = async () => {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            setReservations([]);
            setLoading(false);
            return;
        }

        try {
            const response = await reservationService.getReservationsByUserId(userId);
            const loadedReservations = response.data || [];

            setReservations(loadedReservations);

            loadedReservations.forEach((reservation) => {
                if (reservation.status !== "PENDING_PAYMENT") {
                    removeStoredDeadlines(reservation);
                }
            });
        } catch (error) {
            console.error("Error loading reservations:", error);
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    const resetPaymentForm = () => {
        setPaymentReservationId(null);
        setCardNumber("");
        setCardExpiration("");
        setCardCvv("");
    };

    const handleCancelReservation = async (reservationId) => {
        const confirmed = window.confirm("¿Estás seguro de que deseas cancelar esta reserva?");

        if (!confirmed) {
            return;
        }

        try {
            const reservationToCancel = reservations.find(
                (reservation) => Number(reservation.id) === Number(reservationId)
            );

            await reservationService.cancelReservation(reservationId);
            removeStoredDeadlines(reservationToCancel);
            alert("Reserva cancelada correctamente");
            resetPaymentForm();
            loadReservations();
        } catch (error) {
            console.error("Error canceling reservation:", error);

            const backendMessage =
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Ocurrió un error al cancelar la reserva";

            alert(backendMessage);
        }
    };

    const handleTogglePaymentForm = (reservation) => {
        if (isReservationExpiredForUi(reservation, currentTime)) {
            alert("La reserva expiró por falta de pago. Los cupos fueron liberados.");
            resetPaymentForm();
            loadReservations();
            return;
        }

        if (paymentReservationId === reservation.id) {
            resetPaymentForm();
            return;
        }

        setPaymentReservationId(reservation.id);
        setCardNumber("");
        setCardExpiration("");
        setCardCvv("");
    };

    const handleConfirmPayment = async (reservation) => {
        if (isReservationExpiredForUi(reservation, currentTime)) {
            alert("La reserva expiró por falta de pago. Los cupos fueron liberados.");
            resetPaymentForm();
            loadReservations();
            return;
        }

        if (!cardNumber || !cardExpiration || !cardCvv) {
            alert("Debes completar todos los datos de la tarjeta");
            return;
        }

        const normalizedCardNumber = cardNumber.replace(/\s/g, "");
        const normalizedCardExpiration = cardExpiration.includes("/")
            ? cardExpiration
            : `${cardExpiration.slice(0, 2)}/${cardExpiration.slice(2, 4)}`;
        const normalizedCardCvv = cardCvv.trim();

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
                id: reservation.id,
            },
            amount: reservation.finalTotalAmount,
            cardNumber: normalizedCardNumber,
            cardExpiration: normalizedCardExpiration,
            cardCvv: normalizedCardCvv,
        };

        try {
            await paymentService.createPayment(paymentData);
            removeStoredDeadlines(reservation);
            alert("Pago realizado correctamente");
            resetPaymentForm();
            loadReservations();
        } catch (error) {
            console.error("Error creating payment:", error);

            const backendMessage =
                error.response?.data?.error ||
                error.response?.data?.message ||
                (typeof error.response?.data === "string" ? error.response.data : null) ||
                "Ocurrió un error al realizar el pago";

            if (backendMessage.toLowerCase().includes("expirada")) {
                removeStoredDeadlines(reservation);
                resetPaymentForm();
                loadReservations();
            }

            alert(backendMessage);
        }
    };

    if (loading) {
        return (
            <Container sx={{ py: 4 }}>
                <Typography variant="h4">Cargando reservas...</Typography>
            </Container>
        );
    }

    if (!localStorage.getItem("userId")) {
        return (
            <Container sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Mis reservas
                </Typography>
                <Typography>
                    Debes registrarte o iniciar sesión para ver tus reservas.
                </Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
                Mis reservas
            </Typography>

            {reservations.length === 0 ? (
                <Typography>No tienes reservas registradas.</Typography>
            ) : (
                <Stack spacing={3}>
                    {reservations.map((reservation) => {
                        const expiredForUi = isReservationExpiredForUi(reservation, currentTime);
                        const visibleStatus = expiredForUi ? "EXPIRED" : reservation.status;
                        const remainingSeconds = getRemainingSeconds(reservation, currentTime);
                        const canPay =
                            reservation.status === "PENDING_PAYMENT" &&
                            !expiredForUi;
                        const priceBreakdown = buildReservationPriceBreakdown(reservation);

                        return (
                            <Card key={reservation.id} sx={{ borderRadius: 3, boxShadow: 3 }}>
                                <CardContent>
                                    <Stack spacing={1.5}>
                                        <Typography variant="h5" fontWeight="bold">
                                            Reserva #{reservation.id}
                                        </Typography>

                                        <Chip
                                            label={getStatusLabel(visibleStatus)}
                                            color={getStatusColor(visibleStatus)}
                                            sx={{ width: "fit-content" }}
                                        />

                                        <Typography>
                                            <strong>Paquete:</strong> {reservation.tourPackage.name}
                                        </Typography>

                                        <Typography>
                                            <strong>Destino:</strong> {reservation.tourPackage.destination}
                                        </Typography>

                                        <Typography>
                                            <strong>Cantidad de pasajeros:</strong> {reservation.passengerCount}
                                        </Typography>

                                        <PriceBreakdown
                                            title="Resumen comercial de la reserva"
                                            breakdown={priceBreakdown}
                                        />

                                        <Typography>
                                            <strong>Fecha de inicio del tour:</strong>{" "}
                                            {reservation.tourStartDate
                                                ? new Date(`${reservation.tourStartDate}T00:00:00`).toLocaleDateString("es-CL")
                                                : "No registrada"}
                                        </Typography>

                                        <Typography>
                                            <strong>Fecha de término del tour:</strong>{" "}
                                            {reservation.tourEndDate
                                                ? new Date(`${reservation.tourEndDate}T00:00:00`).toLocaleDateString("es-CL")
                                                : "No registrada"}
                                        </Typography>

                                        <Typography>
                                            <strong>Fecha de reserva:</strong>{" "}
                                            {formatBackendDateTime(reservation.reservationDate)}
                                        </Typography>

                                        <Typography>
                                            <strong>Solicitudes especiales:</strong>{" "}
                                            {reservation.specialRequests || "Sin solicitudes especiales"}
                                        </Typography>

                                        {reservation.status === "PENDING_PAYMENT" && !expiredForUi && remainingSeconds !== null && (
                                            <Alert severity="info">
                                                Tiempo restante para pagar:{" "}
                                                <strong>{formatRemainingTime(remainingSeconds)}</strong>
                                            </Alert>
                                        )}

                                        {expiredForUi && reservation.status === "PENDING_PAYMENT" && (
                                            <Alert severity="warning">
                                                La reserva expiró por falta de pago. Los cupos fueron liberados.
                                            </Alert>
                                        )}

                                        {canPay && (
                                            <>
                                                <Stack direction="row" spacing={2}>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => handleTogglePaymentForm(reservation)}
                                                    >
                                                        {paymentReservationId === reservation.id
                                                            ? "Ocultar pago"
                                                            : "Pagar reserva"}
                                                    </Button>

                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={() => handleCancelReservation(reservation.id)}
                                                    >
                                                        Cancelar reserva
                                                    </Button>
                                                </Stack>

                                                <Collapse in={paymentReservationId === reservation.id}>
                                                    <Box sx={{ mt: 2 }}>
                                                        <Stack spacing={2}>
                                                            <Typography variant="h6" fontWeight="bold">
                                                                Datos del pago
                                                            </Typography>

                                                            <PriceBreakdown
                                                                title="Resumen del pago"
                                                                breakdown={priceBreakdown}
                                                            />

                                                            <TextField
                                                                label="Número de tarjeta"
                                                                value={cardNumber}
                                                                onChange={(event) => setCardNumber(event.target.value)}
                                                                fullWidth
                                                            />

                                                            <TextField
                                                                label="Fecha de expiración"
                                                                placeholder="MM/AA"
                                                                value={cardExpiration}
                                                                onChange={(event) => setCardExpiration(event.target.value)}
                                                                fullWidth
                                                            />

                                                            <TextField
                                                                label="CVV"
                                                                value={cardCvv}
                                                                onChange={(event) => setCardCvv(event.target.value)}
                                                                fullWidth
                                                            />

                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                onClick={() => handleConfirmPayment(reservation)}
                                                            >
                                                                Confirmar pago
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                </Collapse>
                                            </>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}
        </Container>
    );
}

export default MyReservationsPage;