import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import tourPackageService from "../services/tourPackage.service";
import PackageCard from "../components/PackageCard";

const normalizeDateOnly = (dateValue) => {
  if (!dateValue) return "";

  return String(dateValue).split("T")[0];
};

const getPackageDurationDays = (tourPackage) => {
  return Number(tourPackage?.durationDays) || 0;
};

function PackagesPage() {
  const { keycloak, initialized } = useKeycloak();

  const [allTourPackages, setAllTourPackages] = useState([]);
  const [filteredTourPackages, setFilteredTourPackages] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [travelType, setTravelType] = useState("");
  const [season, setSeason] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availableDate, setAvailableDate] = useState("");
  const [minDuration, setMinDuration] = useState("");
  const [maxDuration, setMaxDuration] = useState("");

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const isAdmin = initialized && keycloak.authenticated && roles.includes("ADMIN");

  const visibleTourPackages = useMemo(() => {
    if (isAdmin) {
      return allTourPackages;
    }

    return allTourPackages.filter(
      (tourPackage) => tourPackage.status === "AVAILABLE"
    );
  }, [allTourPackages, isAdmin]);

  useEffect(() => {
    loadTourPackages();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    visibleTourPackages,
    searchTerm,
    travelType,
    season,
    category,
    minPrice,
    maxPrice,
    availableDate,
    minDuration,
    maxDuration,
  ]);

  const loadTourPackages = async () => {
    try {
      const response = await tourPackageService.getAllTourPackages();
      setAllTourPackages(response.data);
    } catch (error) {
      console.error("Error loading tour packages:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...visibleTourPackages];

    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (normalizedSearch !== "") {
      filtered = filtered.filter((tourPackage) => {
        const packageName = tourPackage.name?.toLowerCase() || "";
        const packageDestination = tourPackage.destination?.toLowerCase() || "";

        return (
          packageName.includes(normalizedSearch) ||
          packageDestination.includes(normalizedSearch)
        );
      });
    }

    if (travelType !== "") {
      filtered = filtered.filter(
        (tourPackage) => tourPackage.travelType === travelType
      );
    }

    if (season !== "") {
      filtered = filtered.filter(
        (tourPackage) => tourPackage.season === season
      );
    }

    if (category !== "") {
      filtered = filtered.filter(
        (tourPackage) => tourPackage.category === category
      );
    }

    if (minPrice !== "") {
      filtered = filtered.filter(
        (tourPackage) => Number(tourPackage.price) >= Number(minPrice)
      );
    }

    if (maxPrice !== "") {
      filtered = filtered.filter(
        (tourPackage) => Number(tourPackage.price) <= Number(maxPrice)
      );
    }

    if (availableDate !== "") {
      filtered = filtered.filter((tourPackage) => {
        const packageStartDate = normalizeDateOnly(tourPackage.startDate);
        const packageEndDate = normalizeDateOnly(tourPackage.endDate);
        const selectedDate = normalizeDateOnly(availableDate);

        return packageStartDate <= selectedDate && selectedDate <= packageEndDate;
      });
    }

    if (minDuration !== "") {
      filtered = filtered.filter(
        (tourPackage) => getPackageDurationDays(tourPackage) >= Number(minDuration)
      );
    }

    if (maxDuration !== "") {
      filtered = filtered.filter(
        (tourPackage) => getPackageDurationDays(tourPackage) <= Number(maxDuration)
      );
    }

    setFilteredTourPackages(filtered);
  };

  const handleClear = () => {
    setSearchTerm("");
    setTravelType("");
    setSeason("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setAvailableDate("");
    setMinDuration("");
    setMaxDuration("");
  };

  const travelTypeOptions = useMemo(() => {
    return [
      ...new Set(
        visibleTourPackages
          .map((tourPackage) => tourPackage.travelType)
          .filter(Boolean)
      ),
    ];
  }, [visibleTourPackages]);

  const seasonOptions = useMemo(() => {
    return [
      ...new Set(
        visibleTourPackages
          .map((tourPackage) => tourPackage.season)
          .filter(Boolean)
      ),
    ];
  }, [visibleTourPackages]);

  const categoryOptions = useMemo(() => {
    return [
      ...new Set(
        visibleTourPackages
          .map((tourPackage) => tourPackage.category)
          .filter(Boolean)
      ),
    ];
  }, [visibleTourPackages]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Paquetes Turísticos
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "280px 1fr",
          },
          gap: 4,
          alignItems: "start",
        }}
      >
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight="bold">
              Filtros
            </Typography>

            <TextField
              label="Buscar por destino o nombre"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              fullWidth
              variant="outlined"
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de viaje</InputLabel>
              <Select
                value={travelType}
                label="Tipo de viaje"
                onChange={(event) => setTravelType(event.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {travelTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Temporada</InputLabel>
              <Select
                value={season}
                label="Temporada"
                onChange={(event) => setSeason(event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {seasonOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={category}
                label="Categoría"
                onChange={(event) => setCategory(event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {categoryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Precio mínimo"
              type="number"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              fullWidth
            />

            <TextField
              label="Precio máximo"
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              fullWidth
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1, textAlign: "left" }}>
                Fecha disponible
              </Typography>
              <TextField
                type="date"
                value={availableDate}
                onChange={(event) => setAvailableDate(event.target.value)}
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Duración mínima (días)"
              type="number"
              value={minDuration}
              onChange={(event) => setMinDuration(event.target.value)}
              fullWidth
            />

            <TextField
              label="Duración máxima (días)"
              type="number"
              value={maxDuration}
              onChange={(event) => setMaxDuration(event.target.value)}
              fullWidth
            />

            <Button variant="outlined" onClick={handleClear}>
              Limpiar filtros
            </Button>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {filteredTourPackages.length} paquete(s) encontrado(s)
          </Typography>

          {filteredTourPackages.length === 0 ? (
            <Typography variant="h6">
              No se encontraron paquetes turísticos.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr",
                  lg: "repeat(2, 1fr)",
                  xl: "repeat(2, 1fr)",
                },
                gap: 3,
              }}
            >
              {filteredTourPackages.map((tourPackage) => (
                <PackageCard
                  key={tourPackage.id}
                  tourPackage={tourPackage}
                  showCartButton={initialized && keycloak.authenticated && !isAdmin}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default PackagesPage;