import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import userService from "../services/user.service";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const currentUserEmail = localStorage.getItem("userEmail");

  const loadUsers = async () => {
    try {
      setErrorMessage("");
      const response = await userService.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      setErrorMessage("No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleActivate = async (userId) => {
    try {
      setActionLoadingId(userId);
      setSuccessMessage("");
      setErrorMessage("");

      await userService.activateUser(userId);
      await loadUsers();

      setSuccessMessage("Usuario activado correctamente.");
    } catch (error) {
      console.error("Error activating user:", error);
      setErrorMessage("No se pudo activar el usuario.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      setActionLoadingId(userId);
      setSuccessMessage("");
      setErrorMessage("");

      await userService.deactivateUser(userId);
      await loadUsers();

      setSuccessMessage("Usuario desactivado correctamente.");
    } catch (error) {
      console.error("Error deactivating user:", error);
      setErrorMessage("No se pudo desactivar el usuario.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 6, color: "#ffffff" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Cargando usuarios...</Typography>
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Gestión de usuarios
      </Typography>

      <Typography sx={{ mb: 3, color: "#ffffff" }}>
        Administra el estado de las cuentas registradas en la plataforma.
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Nacionalidad</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acción</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((user) => {
                const isActive = user.active === true;
                const isCurrentUser = user.email === currentUserEmail;

                return (
                  <TableRow key={user.id}>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "Sin teléfono"}</TableCell>
                    <TableCell>{user.nationality || "Sin nacionalidad"}</TableCell>
                    <TableCell>{user.documentNumber || "Sin documento"}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Chip
                        label={isActive ? "Activo" : "Inactivo"}
                        color={isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {isActive ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          disabled={actionLoadingId === user.id || isCurrentUser}
                          onClick={() => handleDeactivate(user.id)}
                        >
                          Desactivar
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          disabled={actionLoadingId === user.id}
                          onClick={() => handleActivate(user.id)}
                        >
                          Activar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <Typography align="center" sx={{ mt: 3 }}>
              No hay usuarios registrados.
            </Typography>
          )}

          <Typography sx={{ mt: 2, color: "text.secondary", fontSize: "0.9rem" }}>
            Nota: no puedes desactivar tu propia cuenta desde esta pantalla.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default AdminUsersPage;