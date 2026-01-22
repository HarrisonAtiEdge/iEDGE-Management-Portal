const handleSave = async () => {
  const sanitizedServices = services.map((s) => ({
    ...s,
    taxLabel: s.taxLabel || "",
    taxPercent: typeof s.taxPercent === "number" ? s.taxPercent : 0,
    taxType: s.taxType || "none",
  }));

  const requiredFields = [
    { value: client, name: "Client" },
    { value: date, name: "Issue Date" },
    { value: expiryDate, name: "Expiry Date" },
    { value: projectOwner, name: "Project Owner" },
    { value: subject, name: "Subject" },
    { value: paymentTerm, name: "Payment Terms" },
    { value: company, name: "Company" },
    { value: taxType, name: "Tax Type" },
  ];
  const missing = requiredFields.filter((f) => !f.value);
  if (missing.length > 0) {
    showToast(`${missing[0].name} is required`);
    return;
  }

  setLoading(true);

  const subtotal = sanitizedServices.reduce((acc, s) => acc + s.units * s.rate, 0);
  const tax = sanitizedServices.reduce((acc, s) => {
    if (s.taxType === "none") return acc;
    return acc + (s.units * s.rate * (s.taxPercent || 0)) / 100;
  }, 0);
  const total = sanitizedServices.reduce((acc, s) => {
    const base = s.units * s.rate;
    if (s.taxType === "exclusive") {
      return acc + base + (base * (s.taxPercent || 0)) / 100;
    }
    return acc + base;
  }, 0);

  const estimate: Estimate = {
    estimateNo,
    client,
    date,
    expiryDate,
    projectOwner,
    services: sanitizedServices,
    subtotal,
    tax,
    total,
    taxType,
    taxPercent: 0,
    taxCategory: "",
    poNumber,
    paymentTerm,
    company,
    subject,
    message,
    address: selectedClient?.address || "",
    info: selectedClient?.addtionalInfo || "",
    editCount: editId ? (existingEstimate?.editCount || 0) + 1 : 0,
  };

  try {
    if (editId) {
      const ref = doc(db, "estimates", editId);
      await updateDoc(ref, { ...estimate, updatedAt: serverTimestamp() } as any);
    } else {
      await addDoc(collection(db, "estimates"), {
        ...estimate,
        createdAt: serverTimestamp(),
      } as any);
    }

    // ✅ Reset fields ONLY for new estimate
    if (!editId) {
      setClient("");
      setDate("");
      setExpiryDate("");
      setProjectOwner("");
      setSubject("");
      setPaymentTerm("");
      setCompany("");
      setTaxType("");
      setPoNumber("");
      setMessage("");
      setSelectedClient(null);
      setServices([]); // reset service table
    }

    // (keep this as is)
    generatePDF(estimate);
  } catch (err) {
    console.error("Error saving estimate:", err);
    showToast("Failed to save estimate");
  } finally {
    setLoading(false);
  }
};
