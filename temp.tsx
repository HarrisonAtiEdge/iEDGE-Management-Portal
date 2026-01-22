const searchHotels = async () => {
  if (!cityId || !checkIn || !checkOut) {
    alert("Select city and dates");
    return;
  }

  setLoading(true);
  setHotels([]);

  try {
    const hotelSnap = await getDocs(
      query(
        collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items"),
        where("cityId", "==", cityId),
        where("status", "==", "active")
      )
    );

    const hotelPromises = hotelSnap.docs.map(async (doc) => {
      const hotel = { id: doc.id, ...(doc.data() as any) };

      const roomsSnap = await getDocs(
        query(
          collection(
            db,
            "Panels",
            PANEL_ID,
            "Travel",
            "Hotels",
            "items",
            doc.id,
            "rooms"
          ),
          where("rateStartDate", "<=", checkIn),
          where("rateEndDate", ">=", checkOut)
        )
      );

      const rooms = roomsSnap.docs.map((r) => ({
        id: r.id,
        ...(r.data() as any),
      }));

      return rooms.length ? { ...hotel, rooms } : null;
    });

    const results = (await Promise.all(hotelPromises)).filter(Boolean);

    setHotels(results as any[]);
    setCurrentPage(1);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
