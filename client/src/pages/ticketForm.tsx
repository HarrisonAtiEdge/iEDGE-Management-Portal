import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { Plus, Trash2, Save, FileText } from "lucide-react";

import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketPrintable } from "./ticketPrintable";

const PANEL_ID = "IEDGE-SYSTEM";

export type PassengerInfo = {
  title: string;
  firstName: string;
  lastName: string;
  passportNo: string;
  nationality: string;
  dateOfBirth: string;
};

export type FlightInfo = {
  airline: string;
  flightNo: string;
  pnr: string;
  ticketNo: string;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  baggage: string;
};

export type HotelInfo = {
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  mealPlan: string;
  confirmationNo: string;
};

type ProjectOption = {
  id: string;
  projectName: string;
  clientName: string;
  contactPerson: string;
  contactNo: string;
  email: string;
  destination: string;
};

export type TicketFormData = {
  selectedProjectId: string;

  referenceNo: string;
  serviceType: string;
  bookingStatus: string;

  clientName: string;
  contactPerson: string;
  contactNo: string;
  email: string;

  projectName: string;
  destination: string;
  issueDate: string;
  travelStartDate: string;
  travelEndDate: string;

  currency: string;
  baseAmount: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;

  showTicketPrice: boolean;

  passengers: PassengerInfo[];
  flights: FlightInfo[];
  hotels: HotelInfo[];

  notes: string;
  termsAndConditions: string;
};

type TicketFormInitialData = Partial<TicketFormData> & {
  createdAt?: any;
  createdById?: string;
  createdByName?: string;
};

type TicketFormProps = {
  editingRecordId?: string | null;
  editingSource?: "new" | "old" | null;
  initialData?: TicketFormInitialData | null;
  onSaved?: (recordId: string) => void;
  onCancel?: () => void;
};

const emptyPassenger: PassengerInfo = {
  title: "Mr",
  firstName: "",
  lastName: "",
  passportNo: "",
  nationality: "",
  dateOfBirth: "",
};

const emptyFlight: FlightInfo = {
  airline: "",
  flightNo: "",
  pnr: "",
  ticketNo: "",
  from: "",
  to: "",
  departureDate: "",
  departureTime: "",
  arrivalDate: "",
  arrivalTime: "",
  baggage: "",
};

const emptyHotel: HotelInfo = {
  hotelName: "",
  city: "",
  checkIn: "",
  checkOut: "",
  roomType: "",
  mealPlan: "",
  confirmationNo: "",
};

const defaultFormData: TicketFormData = {
  selectedProjectId: "",

  referenceNo: "",
  serviceType: "Air Ticket",
  bookingStatus: "Draft",

  clientName: "",
  contactPerson: "",
  contactNo: "",
  email: "",

  projectName: "",
  destination: "",
  issueDate: new Date().toISOString().slice(0, 10),
  travelStartDate: "",
  travelEndDate: "",

  currency: "PKR",
  baseAmount: "",
  taxAmount: "",
  discountAmount: "",
  totalAmount: "",
  paidAmount: "",

  showTicketPrice: true,

  passengers: [{ ...emptyPassenger }],
  flights: [{ ...emptyFlight }],
  hotels: [],

  notes: "",
  termsAndConditions: "",
};

function getNewTicketsCollectionRef() {
  return collection(db, "Panels", PANEL_ID, "Travel", "Tickets", "Records");
}

function getNewTicketDocRef(ticketId: string) {
  return doc(
    db,
    "Panels",
    PANEL_ID,
    "Travel",
    "Tickets",
    "Records",
    ticketId
  );
}

function getOldTicketDocRef(ticketId: string) {
  return doc(db, "Panels", PANEL_ID, "Travel", ticketId);
}

function toNumber(value: string | number | undefined | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeString(value: any) {
  if (value === undefined || value === null) return "";
  return String(value);
}

function getFreshDefaultFormData(): TicketFormData {
  return {
    ...defaultFormData,
    issueDate: new Date().toISOString().slice(0, 10),
    passengers: [{ ...emptyPassenger }],
    flights: [{ ...emptyFlight }],
    hotels: [],
  };
}

function buildInitialFormData(
  initialData?: TicketFormInitialData | null
): TicketFormData {
  const freshDefault = getFreshDefaultFormData();

  if (!initialData) return freshDefault;

  return {
    ...freshDefault,

    selectedProjectId: normalizeString(initialData.selectedProjectId),

    referenceNo: normalizeString(initialData.referenceNo),
    serviceType: normalizeString(
      initialData.serviceType || freshDefault.serviceType
    ),
    bookingStatus: normalizeString(
      initialData.bookingStatus || freshDefault.bookingStatus
    ),

    clientName: normalizeString(initialData.clientName),
    contactPerson: normalizeString(initialData.contactPerson),
    contactNo: normalizeString(initialData.contactNo),
    email: normalizeString(initialData.email),

    projectName: normalizeString(initialData.projectName),
    destination: normalizeString(initialData.destination),
    issueDate: normalizeString(initialData.issueDate || freshDefault.issueDate),
    travelStartDate: normalizeString(initialData.travelStartDate),
    travelEndDate: normalizeString(initialData.travelEndDate),

    currency: normalizeString(initialData.currency || freshDefault.currency),
    baseAmount: normalizeString(initialData.baseAmount),
    taxAmount: normalizeString(initialData.taxAmount),
    discountAmount: normalizeString(initialData.discountAmount),
    totalAmount: normalizeString(initialData.totalAmount),
    paidAmount: normalizeString(initialData.paidAmount),

    showTicketPrice:
      initialData.showTicketPrice ?? freshDefault.showTicketPrice,

    passengers: initialData.passengers?.length
      ? initialData.passengers
      : freshDefault.passengers,
    flights: initialData.flights?.length
      ? initialData.flights
      : freshDefault.flights,
    hotels: initialData.hotels?.length
      ? initialData.hotels
      : freshDefault.hotels,

    notes: normalizeString(initialData.notes),
    termsAndConditions: normalizeString(initialData.termsAndConditions),
  };
}

export default function TicketForm({
  editingRecordId,
  editingSource = "new",
  initialData,
  onSaved,
  onCancel,
}: TicketFormProps) {
  const { toast } = useToast();
  const { currentUser, userProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [formData, setFormData] = useState<TicketFormData>(() =>
    buildInitialFormData(initialData)
  );

  useEffect(() => {
    setFormData(buildInitialFormData(initialData));
    setShowPreview(false);
  }, [editingRecordId, initialData]);

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);

      try {
        const projectsRef = collection(
          db,
          "Panels",
          PANEL_ID,
          "salesRecords"
        );

        const snapshot = await getDocs(projectsRef);

        const list: ProjectOption[] = snapshot.docs.map((docSnap) => {
          const data: any = docSnap.data();

          return {
            id: docSnap.id,
            projectName:
              data.projectName ||
              data.projectTitle ||
              data.name ||
              data.title ||
              `Project ${docSnap.id}`,
            clientName: data.clientName || data.client || "",
            contactPerson: data.contactPerson || "",
            contactNo:
              data.contactNo || data.contactMobile || data.mobile || "",
            email: data.email || data.clientEmail || "",
            destination: data.destination || "",
          };
        });

        list.sort((a, b) =>
          String(a.projectName || "").localeCompare(String(b.projectName || ""))
        );

        setProjects(list);
      } catch (error) {
        console.error("Error fetching projects:", error);

        toast({
          title: "Error",
          description: "Failed to fetch projects.",
          variant: "destructive",
        });
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  const calculatedTotal = useMemo(() => {
    const base = toNumber(formData.baseAmount);
    const tax = toNumber(formData.taxAmount);
    const discount = toNumber(formData.discountAmount);

    return Math.max(base + tax - discount, 0);
  }, [formData.baseAmount, formData.taxAmount, formData.discountAmount]);

  const remainingAmount = useMemo(() => {
    return Math.max(calculatedTotal - toNumber(formData.paidAmount), 0);
  }, [calculatedTotal, formData.paidAmount]);

  const setField = <K extends keyof TicketFormData>(
    field: K,
    value: TicketFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProjectSelect = (projectId: string) => {
    const selectedProject = projects.find((project) => project.id === projectId);

    if (!selectedProject) return;

    setFormData((prev) => ({
      ...prev,
      selectedProjectId: selectedProject.id,
      projectName: selectedProject.projectName || "",
      clientName: selectedProject.clientName || "",
      contactPerson: selectedProject.contactPerson || "",
      contactNo: selectedProject.contactNo || "",
      email: selectedProject.email || "",
      destination: selectedProject.destination || prev.destination,
    }));
  };

  const updatePassenger = (
    index: number,
    field: keyof PassengerInfo,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      passengers: prev.passengers.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addPassenger = () => {
    setFormData((prev) => ({
      ...prev,
      passengers: [...prev.passengers, { ...emptyPassenger }],
    }));
  };

  const removePassenger = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      passengers:
        prev.passengers.length > 1
          ? prev.passengers.filter((_, i) => i !== index)
          : prev.passengers,
    }));
  };

  const updateFlight = (
    index: number,
    field: keyof FlightInfo,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      flights: prev.flights.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addFlight = () => {
    setFormData((prev) => ({
      ...prev,
      flights: [...prev.flights, { ...emptyFlight }],
    }));
  };

  const removeFlight = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      flights:
        prev.flights.length > 1
          ? prev.flights.filter((_, i) => i !== index)
          : prev.flights,
    }));
  };

  const updateHotel = (
    index: number,
    field: keyof HotelInfo,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      hotels: prev.hotels.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addHotel = () => {
    setFormData((prev) => ({
      ...prev,
      hotels: [...prev.hotels, { ...emptyHotel }],
    }));
  };

  const removeHotel = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      hotels: prev.hotels.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.clientName.trim()) return "Client name is required.";
    if (!formData.serviceType.trim()) return "Service type is required.";

    if (!formData.passengers[0]?.firstName.trim()) {
      return "At least one passenger first name is required.";
    }

    if (!formData.passengers[0]?.lastName.trim()) {
      return "At least one passenger last name is required.";
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateForm();

    if (validationError) {
      toast({
        title: "Missing information",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const cleanedPassengers = formData.passengers.filter(
        (p) => p.firstName.trim() || p.lastName.trim() || p.passportNo.trim()
      );

      const cleanedFlights = formData.flights.filter(
        (f) =>
          f.airline.trim() ||
          f.flightNo.trim() ||
          f.pnr.trim() ||
          f.ticketNo.trim()
      );

      const cleanedHotels = formData.hotels.filter(
        (h) => h.hotelName.trim() || h.confirmationNo.trim()
      );

      const actorId = currentUser?.uid || userProfile?.id || "";
      const actorName =
        userProfile?.displayName || currentUser?.email || "Unknown User";

      const payload: Record<string, any> = {
        selectedProjectId: formData.selectedProjectId || null,

        referenceNo: formData.referenceNo.trim(),
        serviceType: formData.serviceType,
        bookingStatus: formData.bookingStatus,

        clientName: formData.clientName.trim(),
        contactPerson: formData.contactPerson.trim(),
        contactNo: formData.contactNo.trim(),
        email: formData.email.trim(),

        projectName: formData.projectName.trim(),
        destination: formData.destination.trim(),
        issueDate: formData.issueDate || null,
        travelStartDate: formData.travelStartDate || null,
        travelEndDate: formData.travelEndDate || null,

        currency: formData.currency,
        baseAmount: toNumber(formData.baseAmount),
        taxAmount: toNumber(formData.taxAmount),
        discountAmount: toNumber(formData.discountAmount),
        totalAmount: calculatedTotal,
        paidAmount: toNumber(formData.paidAmount),
        remainingAmount,

        showTicketPrice: formData.showTicketPrice,

        passengers: cleanedPassengers,
        flights: cleanedFlights,
        hotels: cleanedHotels,

        notes: formData.notes.trim(),
        termsAndConditions: formData.termsAndConditions.trim(),

        updatedAt: serverTimestamp(),
        updatedById: actorId,
        updatedByName: actorName,
      };

      let savedId = editingRecordId || "";

      if (editingRecordId) {
        await setDoc(
          getNewTicketDocRef(editingRecordId),
          {
            ...payload,
            migratedFromOldTravelPath: editingSource === "old",
          },
          { merge: true }
        );

        if (editingSource === "old") {
          await deleteDoc(getOldTicketDocRef(editingRecordId));
        }

        savedId = editingRecordId;
      } else {
        const docRef = await addDoc(getNewTicketsCollectionRef(), {
          ...payload,
          createdAt: serverTimestamp(),
          createdById: actorId,
          createdByName: actorName,
        });

        savedId = docRef.id;

        setFormData(getFreshDefaultFormData());
        setShowPreview(false);
      }

      toast({
        title: "Success",
        description: editingRecordId
          ? "Ticket record updated successfully."
          : "Ticket record saved successfully.",
      });

      onSaved?.(savedId);
    } catch (error) {
      console.error("Error saving ticket record:", error);

      toast({
        title: "Error",
        description: "Failed to save ticket record.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {editingRecordId ? "Edit Ticket Record" : "Create Ticket Record"}
            </h2>
            <p className="text-sm text-slate-500">
              This will save under Panels / IEDGE-SYSTEM / Travel / Tickets /
              Records.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview((prev) => !prev)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Ticket"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div>
            <Label>Reference No.</Label>
            <Input
              value={formData.referenceNo}
              onChange={(e) => setField("referenceNo", e.target.value)}
              placeholder="TRV-0001"
            />
          </div>

          <div>
            <Label>Project</Label>
            <Select
              value={formData.selectedProjectId || undefined}
              onValueChange={handleProjectSelect}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    projectsLoading ? "Loading projects..." : "Select project"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="no-projects-found" disabled>
                    No projects found
                  </SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName}
                      {project.clientName ? ` - ${project.clientName}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Service Type</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) => setField("serviceType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Air Ticket">Air Ticket</SelectItem>
                <SelectItem value="Hotel Booking">Hotel Booking</SelectItem>
                <SelectItem value="Visa">Visa</SelectItem>
                <SelectItem value="Travel Package">Travel Package</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Booking Status</Label>
            <Select
              value={formData.bookingStatus}
              onValueChange={(value) => setField("bookingStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Client Information
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            <div>
              <Label>Client Name *</Label>
              <Input
                value={formData.clientName}
                onChange={(e) => setField("clientName", e.target.value)}
                placeholder="Client / Company"
              />
            </div>

            <div>
              <Label>Contact Person</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setField("contactPerson", e.target.value)}
                placeholder="Contact person"
              />
            </div>

            <div>
              <Label>Contact No.</Label>
              <Input
                value={formData.contactNo}
                onChange={(e) => setField("contactNo", e.target.value)}
                placeholder="+92..."
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Trip Information
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
            <div>
              <Label>Project / Trip Name</Label>
              <Input
                value={formData.projectName}
                onChange={(e) => setField("projectName", e.target.value)}
                placeholder="Conference / CME / Trip"
              />
            </div>

            <div>
              <Label>Destination</Label>
              <Input
                value={formData.destination}
                onChange={(e) => setField("destination", e.target.value)}
                placeholder="Cape Town / Dubai / London"
              />
            </div>

            <div>
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setField("issueDate", e.target.value)}
              />
            </div>

            <div>
              <Label>Travel Start</Label>
              <Input
                type="date"
                value={formData.travelStartDate}
                onChange={(e) => setField("travelStartDate", e.target.value)}
              />
            </div>

            <div>
              <Label>Travel End</Label>
              <Input
                type="date"
                value={formData.travelEndDate}
                onChange={(e) => setField("travelEndDate", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Passenger Information
            </h3>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPassenger}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Passenger
            </Button>
          </div>

          <div className="space-y-4">
            {formData.passengers.map((passenger, index) => (
              <div key={index} className="rounded-xl border bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-slate-800">
                    Passenger {index + 1}
                  </p>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePassenger(index)}
                    disabled={formData.passengers.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div>
                    <Label>Title</Label>
                    <Select
                      value={passenger.title}
                      onValueChange={(value) =>
                        updatePassenger(index, "title", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Prof">Prof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={passenger.firstName}
                      onChange={(e) =>
                        updatePassenger(index, "firstName", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={passenger.lastName}
                      onChange={(e) =>
                        updatePassenger(index, "lastName", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Passport No.</Label>
                    <Input
                      value={passenger.passportNo}
                      onChange={(e) =>
                        updatePassenger(index, "passportNo", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Nationality</Label>
                    <Input
                      value={passenger.nationality}
                      onChange={(e) =>
                        updatePassenger(index, "nationality", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={passenger.dateOfBirth}
                      onChange={(e) =>
                        updatePassenger(index, "dateOfBirth", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Flight Information
            </h3>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFlight}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Flight
            </Button>
          </div>

          <div className="space-y-4">
            {formData.flights.map((flight, index) => (
              <div key={index} className="rounded-xl border bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-slate-800">
                    Flight {index + 1}
                  </p>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFlight(index)}
                    disabled={formData.flights.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div>
                    <Label>Airline</Label>
                    <Input
                      value={flight.airline}
                      onChange={(e) =>
                        updateFlight(index, "airline", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Flight No.</Label>
                    <Input
                      value={flight.flightNo}
                      onChange={(e) =>
                        updateFlight(index, "flightNo", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>PNR</Label>
                    <Input
                      value={flight.pnr}
                      onChange={(e) =>
                        updateFlight(index, "pnr", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Ticket No.</Label>
                    <Input
                      value={flight.ticketNo}
                      onChange={(e) =>
                        updateFlight(index, "ticketNo", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>From</Label>
                    <Input
                      value={flight.from}
                      onChange={(e) =>
                        updateFlight(index, "from", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>To</Label>
                    <Input
                      value={flight.to}
                      onChange={(e) =>
                        updateFlight(index, "to", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Departure Date</Label>
                    <Input
                      type="date"
                      value={flight.departureDate}
                      onChange={(e) =>
                        updateFlight(index, "departureDate", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Departure Time</Label>
                    <Input
                      type="time"
                      value={flight.departureTime}
                      onChange={(e) =>
                        updateFlight(index, "departureTime", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Arrival Date</Label>
                    <Input
                      type="date"
                      value={flight.arrivalDate}
                      onChange={(e) =>
                        updateFlight(index, "arrivalDate", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Arrival Time</Label>
                    <Input
                      type="time"
                      value={flight.arrivalTime}
                      onChange={(e) =>
                        updateFlight(index, "arrivalTime", e.target.value)
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Baggage</Label>
                    <Input
                      value={flight.baggage}
                      onChange={(e) =>
                        updateFlight(index, "baggage", e.target.value)
                      }
                      placeholder="30 KG / 2 Pieces"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Hotel Information
            </h3>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHotel}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Hotel
            </Button>
          </div>

          {formData.hotels.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
              No hotel added. Click Add Hotel if this ticket includes hotel
              booking.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.hotels.map((hotel, index) => (
                <div key={index} className="rounded-xl border bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-medium text-slate-800">
                      Hotel {index + 1}
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHotel(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
                    <div>
                      <Label>Hotel Name</Label>
                      <Input
                        value={hotel.hotelName}
                        onChange={(e) =>
                          updateHotel(index, "hotelName", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>City</Label>
                      <Input
                        value={hotel.city}
                        onChange={(e) =>
                          updateHotel(index, "city", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Check In</Label>
                      <Input
                        type="date"
                        value={hotel.checkIn}
                        onChange={(e) =>
                          updateHotel(index, "checkIn", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Check Out</Label>
                      <Input
                        type="date"
                        value={hotel.checkOut}
                        onChange={(e) =>
                          updateHotel(index, "checkOut", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Room Type</Label>
                      <Input
                        value={hotel.roomType}
                        onChange={(e) =>
                          updateHotel(index, "roomType", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Meal Plan</Label>
                      <Input
                        value={hotel.mealPlan}
                        onChange={(e) =>
                          updateHotel(index, "mealPlan", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Confirmation No.</Label>
                      <Input
                        value={hotel.confirmationNo}
                        onChange={(e) =>
                          updateHotel(index, "confirmationNo", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Amount Details
          </h3>

          <div className="mb-4 flex items-center gap-2 rounded-xl border bg-slate-50 p-4">
            <Checkbox
              id="showTicketPrice"
              checked={formData.showTicketPrice}
              onCheckedChange={(checked) =>
                setField("showTicketPrice", checked === true)
              }
            />
            <Label htmlFor="showTicketPrice" className="cursor-pointer">
              Show ticket price on printable / PDF
            </Label>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-7">
            <div>
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setField("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="ZAR">ZAR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Base Amount</Label>
              <Input
                type="number"
                value={formData.baseAmount}
                onChange={(e) => setField("baseAmount", e.target.value)}
              />
            </div>

            <div>
              <Label>Tax Amount</Label>
              <Input
                type="number"
                value={formData.taxAmount}
                onChange={(e) => setField("taxAmount", e.target.value)}
              />
            </div>

            <div>
              <Label>Discount</Label>
              <Input
                type="number"
                value={formData.discountAmount}
                onChange={(e) => setField("discountAmount", e.target.value)}
              />
            </div>

            <div>
              <Label>Total</Label>
              <Input value={String(calculatedTotal)} disabled />
            </div>

            <div>
              <Label>Paid</Label>
              <Input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setField("paidAmount", e.target.value)}
              />
            </div>

            <div>
              <Label>Remaining</Label>
              <Input value={String(remainingAmount)} disabled />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={4}
              placeholder="Internal or customer notes..."
            />
          </div>

          <div>
            <Label>Terms & Conditions</Label>
            <Textarea
              value={formData.termsAndConditions}
              onChange={(e) =>
                setField("termsAndConditions", e.target.value)
              }
              rows={4}
              placeholder="Ticket terms, refund rules, hotel policy, etc."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-5">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}

          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {loading
              ? "Saving..."
              : editingRecordId
                ? "Update Record"
                : "Save Record"}
          </Button>
        </div>
      </div>

      {showPreview && (
        <TicketPrintable
          data={{
            ...formData,
            totalAmount: String(calculatedTotal),
          }}
        />
      )}
    </div>
  );
}