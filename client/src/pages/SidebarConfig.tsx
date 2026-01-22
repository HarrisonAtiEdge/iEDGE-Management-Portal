"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type SidebarItem = { label: string; path: string; icon: string };

const PANEL_ID = "IEDGE-SYSTEM";

export default function SidebarConfig() {
  const [config, setConfig] = useState<Record<string, SidebarItem[]>>({});
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      // ✅ moved under panel
      const snap = await getDoc(doc(db, "Panels", PANEL_ID, "config", "sidebar"));
      if (snap.exists()) {
        setConfig(snap.data() as Record<string, SidebarItem[]>);
      } else {
        setConfig({});
      }
    };
    fetchConfig();
  }, []);

  const addRole = () => {
    const role = newRole.trim();
    if (!role || config[role]) return;
    setConfig((prev) => ({ ...prev, [role]: [] }));
    setNewRole("");
  };

  const addItem = (role: string) => {
    setConfig((prev) => ({
      ...prev,
      [role]: [
        ...(prev[role] || []),
        { label: "New Item", path: "/new", icon: "LayoutDashboard" },
      ],
    }));
  };

  const updateItem = (
    role: string,
    index: number,
    key: keyof SidebarItem,
    value: string
  ) => {
    setConfig((prev) => {
      const updated = [...(prev[role] || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, [role]: updated };
    });
  };

  const deleteItem = (role: string, index: number) => {
    setConfig((prev) => {
      const updated = [...(prev[role] || [])];
      updated.splice(index, 1);
      return { ...prev, [role]: updated };
    });
  };

  const saveConfig = async () => {
    // ✅ save under panel
    await setDoc(doc(db, "Panels", PANEL_ID, "config", "sidebar"), config, {
      merge: true,
    });
    alert("Sidebar updated!");
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Sidebar Config Editor</h2>

      <div className="flex gap-2">
        <Input
          placeholder="Add role (e.g. manager)"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        />
        <Button onClick={addRole}>Add Role</Button>
      </div>

      {Object.keys(config).map((role) => (
        <Card key={role}>
          <CardHeader className="font-semibold">{role.toUpperCase()}</CardHeader>
          <CardContent className="space-y-3">
            {(config[role] || []).map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={item.label}
                  onChange={(e) => updateItem(role, i, "label", e.target.value)}
                  placeholder="Label"
                />
                <Input
                  value={item.path}
                  onChange={(e) => updateItem(role, i, "path", e.target.value)}
                  placeholder="Path"
                />
                <Input
                  value={item.icon}
                  onChange={(e) => updateItem(role, i, "icon", e.target.value)}
                  placeholder="Icon"
                />
                <Button variant="destructive" onClick={() => deleteItem(role, i)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button onClick={() => addItem(role)}>Add Item</Button>
          </CardContent>
        </Card>
      ))}

      <Button onClick={saveConfig} className="w-full">
        Save Config
      </Button>
    </div>
  );
}
