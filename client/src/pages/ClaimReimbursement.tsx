import React, { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FolderKanban,
  Fuel,
  ImagePlus,
  Loader2,
  ReceiptText,
  Upload,
  Utensils,
  X,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

type ClaimFor = "project" | "general";
type ClaimType = "fuel" | "food";

const PANEL_ID = "IEDGE-SYSTEM";

const CLOUDINARY_CLOUD_NAME = "iedge-system-travel-uploads";
const CLOUDINARY_UPLOAD_PRESET = "cloud-water";

interface ClaimFormState {
  claimFor: ClaimFor;
  projectCode: string;
  claimType: ClaimType;
  claimAmount: string;
  km: string;
  foodItem: string;
  description: string;
  billImage: File | null;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  original_filename?: string;
  format?: string;
  resource_type?: string;
}

const initialFormState: ClaimFormState = {
  claimFor: "general",
  projectCode: "",
  claimType: "fuel",
  claimAmount: "",
  km: "",
  foodItem: "",
  description: "",
  billImage: null,
};

export default function ClaimReimbursement() {
  const { currentUser, userProfile } = useAuth();

  const [formData, setFormData] = useState<ClaimFormState>(initialFormState);
  const [billPreview, setBillPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const createdByName = useMemo(() => {
    return (
      userProfile?.displayName ||
      currentUser?.displayName ||
      currentUser?.email ||
      "Unknown User"
    );
  }, [userProfile, currentUser]);

  const inputClass =
    "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100";

  const labelClass = "mb-2 block text-sm font-medium text-slate-700";

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage(null);
  }

  function handleClaimForChange(value: ClaimFor) {
    setFormData((prev) => ({
      ...prev,
      claimFor: value,
      projectCode: value === "general" ? "" : prev.projectCode,
    }));

    setMessage(null);
  }

  function handleClaimTypeChange(value: ClaimType) {
    setFormData((prev) => ({
      ...prev,
      claimType: value,
      km: value === "food" ? "" : prev.km,
      foodItem: value === "fuel" ? "" : prev.foodItem,
    }));

    setMessage(null);
  }

  function handleBillImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;

    if (!file) {
      removeBillImage();
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please upload a valid image file.",
      });
      e.target.value = "";
      return;
    }

    const maxSizeInMB = 5;

    if (file.size > maxSizeInMB * 1024 * 1024) {
      setMessage({
        type: "error",
        text: `Bill image must be less than ${maxSizeInMB}MB.`,
      });
      e.target.value = "";
      return;
    }

    if (billPreview) {
      URL.revokeObjectURL(billPreview);
    }

    setFormData((prev) => ({
      ...prev,
      billImage: file,
    }));

    setBillPreview(URL.createObjectURL(file));
    setMessage(null);
  }

  function removeBillImage() {
    if (billPreview) {
      URL.revokeObjectURL(billPreview);
    }

    setFormData((prev) => ({
      ...prev,
      billImage: null,
    }));

    setBillPreview("");
  }

  function validateForm() {
    if (!userProfile && !currentUser) {
      return "User profile not found. Please login again.";
    }

    if (formData.claimFor === "project" && !formData.projectCode.trim()) {
      return "Project Code is required for project reimbursement.";
    }

    if (!formData.claimAmount || Number(formData.claimAmount) <= 0) {
      return "Please enter a valid Claim Amount.";
    }

    if (formData.claimType === "fuel") {
      if (!formData.km || Number(formData.km) <= 0) {
        return "Please enter valid KM for fuel claim.";
      }
    }

    if (formData.claimType === "food") {
      if (!formData.foodItem.trim()) {
        return "Food Item is required for food claim.";
      }
    }

    if (
      formData.billImage &&
      (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET)
    ) {
      return "Cloudinary configuration is missing.";
    }

    return "";
  }

  async function uploadBillImageToCloudinary(file: File) {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    uploadData.append("folder", `Panels/${PANEL_ID}/reimbursementsForallUsers`);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: uploadData,
    });

    if (!response.ok) {
      throw new Error("Cloudinary image upload failed.");
    }

    const data = (await response.json()) as CloudinaryUploadResponse;

    return {
      billImageUrl: data.secure_url,
      billImagePublicId: data.public_id,
      billImageOriginalName: data.original_filename || file.name,
      billImageFormat: data.format || "",
      billImageProvider: "cloudinary",
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const validationError = validateForm();

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });
      return;
    }

    try {
      setSubmitting(true);

      let uploadedBill = {
        billImageUrl: "",
        billImagePublicId: "",
        billImageOriginalName: "",
        billImageFormat: "",
        billImageProvider: "",
      };

      if (formData.billImage) {
        uploadedBill = await uploadBillImageToCloudinary(formData.billImage);
      }

      await addDoc(collection(db, "Panels", PANEL_ID, "claimReimbursements"), {
        claimFor: formData.claimFor,
        projectCode:
          formData.claimFor === "project" ? formData.projectCode.trim() : "",

        claimType: formData.claimType,
        claimAmount: Number(formData.claimAmount),

        km: formData.claimType === "fuel" ? Number(formData.km) : null,
        foodItem:
          formData.claimType === "food" ? formData.foodItem.trim() : "",

        description: formData.description.trim(),

        billImageUrl: uploadedBill.billImageUrl,
        billImagePublicId: uploadedBill.billImagePublicId,
        billImageOriginalName: uploadedBill.billImageOriginalName,
        billImageFormat: uploadedBill.billImageFormat,
        billImageProvider: uploadedBill.billImageProvider,

        status: "pending",

        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        submittedBy: userProfile?.id || currentUser?.uid || "",
        submittedByName: createdByName,
        submittedByEmail: userProfile?.email || currentUser?.email || "",
        submittedByRole: userProfile?.role || "",

        createdBy: userProfile?.id || currentUser?.uid || "",
        createdByName,
        createdByEmail: userProfile?.email || currentUser?.email || "",
        createdByRole: userProfile?.role || "",
      });

      setFormData(initialFormState);
      removeBillImage();

      setMessage({
        type: "success",
        text: "Claim reimbursement submitted successfully.",
      });
    } catch (error) {
      console.error("Claim reimbursement submit error:", error);

      setMessage({
        type: "error",
        text: "Failed to submit claim reimbursement. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-0 overflow-x-hidden bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <ReceiptText className="h-3.5 w-3.5" />
              Reimbursement Request
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Submit fuel or food claims with clean tracking, optional notes,
              and optional bill attachment.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Submitted by</p>
            <p className="text-sm font-semibold text-slate-900">
              {createdByName}
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ">
            <section>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-950">
                  Claim Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select whether this claim belongs to a project or is general.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleClaimForChange("general")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    formData.claimFor === "general"
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="mb-3 h-5 w-5" />
                  <p className="text-sm font-semibold">General</p>
                  <p
                    className={`mt-1 text-xs ${
                      formData.claimFor === "general"
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    Regular office or non-project claim.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleClaimForChange("project")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    formData.claimFor === "project"
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <FolderKanban className="mb-3 h-5 w-5" />
                  <p className="text-sm font-semibold">Project</p>
                  <p
                    className={`mt-1 text-xs ${
                      formData.claimFor === "project"
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    Claim linked with a project code.
                  </p>
                </button>
              </div>

              {formData.claimFor === "project" && (
                <div className="mt-5">
                  <label className={labelClass}>
                    Project Code <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="projectCode"
                    value={formData.projectCode}
                    onChange={handleInputChange}
                    placeholder="Enter project code"
                    className={inputClass}
                  />
                </div>
              )}
            </section>

            <div className="h-px bg-slate-100" />

            <section>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-950">
                  Reimbursement Type
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the claim category and fill only the required details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleClaimTypeChange("fuel")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    formData.claimType === "fuel"
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Fuel className="mb-3 h-5 w-5" />
                  <p className="text-sm font-semibold">Fuel</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Claim fuel expense with KM.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleClaimTypeChange("food")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    formData.claimType === "food"
                      ? "border-orange-500 bg-orange-50 text-orange-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Utensils className="mb-3 h-5 w-5" />
                  <p className="text-sm font-semibold">Food</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Claim food or meal expense.
                  </p>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Claim Amount <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    name="claimAmount"
                    value={formData.claimAmount}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={inputClass}
                  />
                </div>

                {formData.claimType === "fuel" && (
                  <div>
                    <label className={labelClass}>
                      KM <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="number"
                      name="km"
                      value={formData.km}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={inputClass}
                    />
                  </div>
                )}

                {formData.claimType === "food" && (
                  <div>
                    <label className={labelClass}>
                      Food Item <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="foodItem"
                      value={formData.foodItem}
                      onChange={handleInputChange}
                      placeholder="Enter food item"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </section>

            <div className="h-px bg-slate-100" />

            <section>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-950">
                  Additional Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Description and bill image are optional.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Description</label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Add a short note, if needed"
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className={labelClass}>Bill Image</label>

                  {!billPreview ? (
                    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center transition hover:border-slate-400 hover:bg-slate-100">
                      <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm transition group-hover:scale-105">
                        <Upload className="h-5 w-5 text-slate-600" />
                      </div>

                      <span className="text-sm font-semibold text-slate-800">
                        Upload bill image
                      </span>

                      <span className="mt-1 text-xs text-slate-500">
                        Optional - PNG, JPG, JPEG up to 5MB
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBillImageChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ImagePlus className="h-4 w-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-800">
                            Bill Preview
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={removeBillImage}
                          className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <img
                        src={billPreview}
                        alt="Bill Preview"
                        className="h-44 w-full bg-slate-50 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setFormData(initialFormState);
                  removeBillImage();
                  setMessage(null);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Claim"
                )}
              </button>
            </div>
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <ReceiptText className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    Claim Summary
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review before submitting
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Claim For</span>
                  <span className="font-medium capitalize text-slate-900">
                    {formData.claimFor}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium capitalize text-slate-900">
                    {formData.claimType}
                  </span>
                </div>

                {formData.claimFor === "project" && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Project Code</span>
                    <span className="max-w-[160px] truncate font-medium text-slate-900">
                      {formData.projectCode || "Not added"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-semibold text-slate-950">
                    Rs{" "}
                    {Number(formData.claimAmount || 0).toLocaleString("en-PK")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    {formData.claimType === "fuel" ? "KM" : "Food Item"}
                  </span>
                  <span className="max-w-[160px] truncate font-medium text-slate-900">
                    {formData.claimType === "fuel"
                      ? formData.km || "0"
                      : formData.foodItem || "Not added"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Description</span>
                  <span className="font-medium text-slate-900">
                    {formData.description.trim() ? "Added" : "Optional"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Bill Image</span>
                  <span className="font-medium text-slate-900">
                    {formData.billImage ? "Attached" : "Optional"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-sm font-semibold">Status after submit</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The claim will be saved as{" "}
                <span className="font-semibold text-white">Pending</span> and
                will appear in the Reimbursements Dashboard automatically.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}