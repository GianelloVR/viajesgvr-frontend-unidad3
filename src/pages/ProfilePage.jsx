import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useKeycloak } from "@react-keycloak/web";
import userService from "../services/user.service";

function ProfilePage() {
  const { keycloak, initialized } = useKeycloak();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    documentNumber: "",
  });

  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountInactive, setAccountInactive] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await userService.getCurrentUser();

        const user = {
          fullName: response.data.fullName || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          nationality: response.data.nationality || "",
          documentNumber: response.data.documentNumber || "",
        };

        localStorage.removeItem("userAccountInactive");

        setAccountInactive(false);
        setFormData(user);
        setOriginalData(user);
      } catch (error) {
        console.error("Error loading user profile:", error);

        if (error.response?.status === 403) {
          localStorage.setItem("userAccountInactive", "true");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userFullName");

          setAccountInactive(true);
          setErrorMessage("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
          window.dispatchEvent(new Event("userAccessChanged"));
          return;
        }

        setErrorMessage("No se pudo cargar la información del perfil.");
      } finally {
        setLoading(false);
      }
    };

    if (initialized && keycloak.authenticated) {
      loadProfile();
    }

    if (initialized && !keycloak.authenticated) {
      setLoading(false);
      setErrorMessage("Debes iniciar sesión para ver tu perfil.");
    }
  }, [initialized, keycloak.authenticated]);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return "El nombre completo es obligatorio.";
    }

    if (!formData.phone.trim()) {
      return "El teléfono es obligatorio.";
    }

    if (formData.phone.trim().length < 8 || formData.phone.trim().length > 20) {
      return "El teléfono debe tener entre 8 y 20 caracteres.";
    }

    if (!formData.nationality.trim()) {
      return "La nacionalidad es obligatoria.";
    }

    if (
      formData.nationality.trim().length < 3 ||
      formData.nationality.trim().length > 80
    ) {
      return "La nacionalidad debe tener entre 3 y 80 caracteres.";
    }

    if (!formData.documentNumber.trim()) {
      return "El documento de identidad es obligatorio.";
    }

    if (
      formData.documentNumber.trim().length < 5 ||
      formData.documentNumber.trim().length > 30
    ) {
      return "El documento de identidad debe tener entre 5 y 30 caracteres.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (accountInactive) {
      setErrorMessage("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        nationality: formData.nationality.trim(),
        documentNumber: formData.documentNumber.trim(),
      };

      const response = await userService.updateCurrentUserProfile(payload);

      const updatedUser = {
        fullName: response.data.fullName || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        nationality: response.data.nationality || "",
        documentNumber: response.data.documentNumber || "",
      };

      setFormData(updatedUser);
      setOriginalData(updatedUser);

      localStorage.setItem("userFullName", updatedUser.fullName);
      window.dispatchEvent(new Event("profileUpdated"));

      setSuccessMessage("Perfil actualizado correctamente.");
    } catch (error) {
      console.error("Error updating user profile:", error);

      if (error.response?.status === 403) {
        localStorage.setItem("userAccountInactive", "true");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userFullName");

        setAccountInactive(true);
        setErrorMessage("Tu cuenta se encuentra inactiva. Contacta con la agencia.");
        window.dispatchEvent(new Event("userAccessChanged"));
        return;
      }

      setErrorMessage(
        error.response?.data?.error || "No se pudo actualizar el perfil."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
      setSuccessMessage("");
      setErrorMessage("");
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 6, color: "#ffffff" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Cargando perfil...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 5, mb: 5 }}>
      <Card sx={{ width: "100%", maxWidth: 600, borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Mi perfil
          </Typography>

          <Typography align="center" sx={{ mb: 3, color: "text.secondary" }}>
            Aquí puedes actualizar tus datos personales.
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert severity={accountInactive ? "warning" : "error"} sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Nombre completo"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              disabled={accountInactive}
            />

            <TextField
              label="Correo electrónico"
              name="email"
              value={formData.email}
              fullWidth
              margin="normal"
              disabled
              helperText="El correo es administrado por Keycloak."
            />

            <TextField
              label="Teléfono"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              disabled={accountInactive}
            />

            <TextField
              label="Nacionalidad"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              disabled={accountInactive}
            />

            <TextField
              label="Documento de identidad"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              disabled={accountInactive}
            />

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={saving || accountInactive}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleCancel}
                disabled={saving || accountInactive}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfilePage;