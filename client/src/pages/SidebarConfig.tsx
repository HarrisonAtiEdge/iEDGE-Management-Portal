// "use client";
// import { useState, useEffect } from "react";
// import { db } from "@/lib/firebase";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardHeader, CardContent } from "@/components/ui/card";

// type SidebarItem = { label: string; path: string; icon: string };

// const PANEL_ID = "IEDGE-SYSTEM";

// export default function SidebarConfig() {
//   const [config, setConfig] = useState<Record<string, SidebarItem[]>>({});
//   const [newRole, setNewRole] = useState("");

//   useEffect(() => {
//     const fetchConfig = async () => {
//       // ✅ moved under panel
//       const snap = await getDoc(doc(db, "Panels", PANEL_ID, "config", "sidebar"));
//       if (snap.exists()) {
//         setConfig(snap.data() as Record<string, SidebarItem[]>);
//       } else {
//         setConfig({});
//       }
//     };
//     fetchConfig();
//   }, []);

//   const addRole = () => {
//     const role = newRole.trim();
//     if (!role || config[role]) return;
//     setConfig((prev) => ({ ...prev, [role]: [] }));
//     setNewRole("");
//   };

//   const addItem = (role: string) => {
//     setConfig((prev) => ({
//       ...prev,
//       [role]: [
//         ...(prev[role] || []),
//         { label: "New Item", path: "/new", icon: "LayoutDashboard" },
//       ],
//     }));
//   };

//   const updateItem = (
//     role: string,
//     index: number,
//     key: keyof SidebarItem,
//     value: string
//   ) => {
//     setConfig((prev) => {
//       const updated = [...(prev[role] || [])];
//       updated[index] = { ...updated[index], [key]: value };
//       return { ...prev, [role]: updated };
//     });
//   };

//   const deleteItem = (role: string, index: number) => {
//     setConfig((prev) => {
//       const updated = [...(prev[role] || [])];
//       updated.splice(index, 1);
//       return { ...prev, [role]: updated };
//     });
//   };

//   const saveConfig = async () => {
//     // ✅ save under panel
//     await setDoc(doc(db, "Panels", PANEL_ID, "config", "sidebar"), config, {
//       merge: true,
//     });
//     alert("Sidebar updated!");
//   };

//   return (
//     <div className="space-y-6 p-6">
//       <h2 className="text-xl font-bold">Sidebar Config Editor</h2>

//       <div className="flex gap-2">
//         <Input
//           placeholder="Add role (e.g. manager)"
//           value={newRole}
//           onChange={(e) => setNewRole(e.target.value)}
//         />
//         <Button onClick={addRole}>Add Role</Button>
//       </div>

//       {Object.keys(config).map((role) => (
//         <Card key={role}>
//           <CardHeader className="font-semibold">{role.toUpperCase()}</CardHeader>
//           <CardContent className="space-y-3">
//             {(config[role] || []).map((item, i) => (
//               <div key={i} className="flex gap-2 items-center">
//                 <Input
//                   value={item.label}
//                   onChange={(e) => updateItem(role, i, "label", e.target.value)}
//                   placeholder="Label"
//                 />
//                 <Input
//                   value={item.path}
//                   onChange={(e) => updateItem(role, i, "path", e.target.value)}
//                   placeholder="Path"
//                 />
//                 <Input
//                   value={item.icon}
//                   onChange={(e) => updateItem(role, i, "icon", e.target.value)}
//                   placeholder="Icon"
//                 />
//                 <Button variant="destructive" onClick={() => deleteItem(role, i)}>
//                   Remove
//                 </Button>
//               </div>
//             ))}
//             <Button onClick={() => addItem(role)}>Add Item</Button>
//           </CardContent>
//         </Card>
//       ))}

//       <Button onClick={saveConfig} className="w-full">
//         Save Config
//       </Button>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type SidebarItem = {
  label: string;
  path: string;
  icon: string;
  children?: SidebarItem[];
};

const PANEL_ID = "IEDGE-SYSTEM";

const CONTACTS_DROPDOWN: SidebarItem = {
  label: "Contacts Directory",
  path: "#",
  icon: "BookUser",
  children: [
    { label: "Clients", path: "/clients", icon: "Users" },
    { label: "Suppliers", path: "/suppliers", icon: "BookUser" },
    { label: "Contact Persons", path: "/contact-persons", icon: "User" },
  ],
};

const FINANCE_DROPDOWN: SidebarItem = {
  label: "Finance",
  path: "#",
  icon: "Wallet",
  children: [
    { label: "Invoices", path: "/invoices", icon: "FileText" },
    { label: "Payments", path: "/payments", icon: "CreditCard" },
    { label: "Accounts", path: "/accounts", icon: "Landmark" },
  ],
};

const DEFAULT_SIDEBAR_CONFIG: Record<string, SidebarItem[]> = {
  admin: [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    CONTACTS_DROPDOWN,
    FINANCE_DROPDOWN,
  ],

  main_admin: [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    { label: "RTD Management", path: "/rtd-management", icon: "FileText" },
    CONTACTS_DROPDOWN,
    FINANCE_DROPDOWN,
  ],

  finance: [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    FINANCE_DROPDOWN,
  ],

  sales: [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    CONTACTS_DROPDOWN,
  ],
};

function cloneSidebarItem(item: SidebarItem): SidebarItem {
  return {
    ...item,
    children: item.children?.map(cloneSidebarItem),
  };
}

function cloneSidebarConfig(
  config: Record<string, SidebarItem[]>,
): Record<string, SidebarItem[]> {
  const clonedConfig: Record<string, SidebarItem[]> = {};

  Object.entries(config).forEach(([role, items]) => {
    clonedConfig[role] = items.map(cloneSidebarItem);
  });

  return clonedConfig;
}

export default function SidebarConfig() {
  const [config, setConfig] = useState<Record<string, SidebarItem[]>>({});
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const normalizeRole = (role: string) => role.trim().toLowerCase();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);

        const snap = await getDoc(
          doc(db, "Panels", PANEL_ID, "config", "sidebar"),
        );

        if (snap.exists()) {
          const data = snap.data() as Record<string, SidebarItem[]>;

          const cleanedConfig: Record<string, SidebarItem[]> = {};

          Object.entries(data).forEach(([role, items]) => {
            if (Array.isArray(items)) {
              cleanedConfig[normalizeRole(role)] = items;
            }
          });

          if (Object.keys(cleanedConfig).length > 0) {
            setConfig(cleanedConfig);
          } else {
            setConfig(cloneSidebarConfig(DEFAULT_SIDEBAR_CONFIG));
          }
        } else {
          setConfig(cloneSidebarConfig(DEFAULT_SIDEBAR_CONFIG));
        }
      } catch (error) {
        console.error("Error fetching sidebar config:", error);
        setConfig(cloneSidebarConfig(DEFAULT_SIDEBAR_CONFIG));
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const addRole = () => {
    const role = normalizeRole(newRole);

    if (!role) {
      alert("Please enter a role name.");
      return;
    }

    if (config[role]) {
      alert("This role already exists.");
      return;
    }

    setConfig((prev) => ({
      ...prev,
      [role]: [],
    }));

    setNewRole("");
  };

  const deleteRole = (role: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${role.toUpperCase()} sidebar config?`,
    );

    if (!confirmDelete) return;

    setConfig((prev) => {
      const updated = { ...prev };
      delete updated[role];
      return updated;
    });
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

  const addDropdown = (role: string, dropdown: SidebarItem) => {
    setConfig((prev) => ({
      ...prev,
      [role]: [...(prev[role] || []), cloneSidebarItem(dropdown)],
    }));
  };

  const updateItem = (
    role: string,
    index: number,
    key: keyof SidebarItem,
    value: string,
  ) => {
    setConfig((prev) => {
      const updated = [...(prev[role] || [])];

      updated[index] = {
        ...updated[index],
        [key]: value,
      };

      return {
        ...prev,
        [role]: updated,
      };
    });
  };

  const deleteItem = (role: string, index: number) => {
    setConfig((prev) => {
      const updated = [...(prev[role] || [])];
      updated.splice(index, 1);

      return {
        ...prev,
        [role]: updated,
      };
    });
  };

  const addChildItem = (role: string, parentIndex: number) => {
    setConfig((prev) => {
      const updated = [...(prev[role] || [])];
      const parent = updated[parentIndex];

      updated[parentIndex] = {
        ...parent,
        path: parent.path || "#",
        children: [
          ...(parent.children || []),
          {
            label: "New Sub Tab",
            path: "/new-sub",
            icon: "LayoutDashboard",
          },
        ],
      };

      return {
        ...prev,
        [role]: updated,
      };
    });
  };

  const updateChildItem = (
    role: string,
    parentIndex: number,
    childIndex: number,
    key: keyof SidebarItem,
    value: string,
  ) => {
    setConfig((prev) => {
      const updated = [...(prev[role] || [])];
      const parent = updated[parentIndex];
      const children = [...(parent.children || [])];

      children[childIndex] = {
        ...children[childIndex],
        [key]: value,
      };

      updated[parentIndex] = {
        ...parent,
        children,
      };

      return {
        ...prev,
        [role]: updated,
      };
    });
  };

  const deleteChildItem = (
    role: string,
    parentIndex: number,
    childIndex: number,
  ) => {
    setConfig((prev) => {
      const updated = [...(prev[role] || [])];
      const parent = updated[parentIndex];
      const children = [...(parent.children || [])];

      children.splice(childIndex, 1);

      updated[parentIndex] = {
        ...parent,
        children,
      };

      return {
        ...prev,
        [role]: updated,
      };
    });
  };

  const saveConfig = async () => {
    const normalizedConfig: Record<string, SidebarItem[]> = {};

    Object.entries(config).forEach(([role, items]) => {
      const normalizedRole = normalizeRole(role);

      if (normalizedRole) {
        normalizedConfig[normalizedRole] = items;
      }
    });

    try {
      setSaving(true);

      await setDoc(
        doc(db, "Panels", PANEL_ID, "config", "sidebar"),
        normalizedConfig,
      );

      await Promise.all(
        Object.entries(normalizedConfig).map(([role, items]) =>
          setDoc(doc(db, "Panels", PANEL_ID, "sidebarConfig", role), { items }),
        ),
      );

      setConfig(normalizedConfig);
      alert("Sidebar updated successfully!");
    } catch (error) {
      console.error("Error saving sidebar config:", error);
      alert("Failed to save sidebar config.");
    } finally {
      setSaving(false);
    }
  };

  const saveDefaultConfig = async () => {
    const defaultConfig = cloneSidebarConfig(DEFAULT_SIDEBAR_CONFIG);

    try {
      setSaving(true);

      await setDoc(
        doc(db, "Panels", PANEL_ID, "config", "sidebar"),
        defaultConfig,
      );

      await Promise.all(
        Object.entries(defaultConfig).map(([role, items]) =>
          setDoc(doc(db, "Panels", PANEL_ID, "sidebarConfig", role), { items }),
        ),
      );

      setConfig(defaultConfig);
      alert("Default sidebar saved successfully!");
    } catch (error) {
      console.error("Error saving default sidebar config:", error);
      alert("Failed to save default sidebar config.");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaultInUI = () => {
    setConfig(cloneSidebarConfig(DEFAULT_SIDEBAR_CONFIG));
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Loading sidebar config...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold">Sidebar Config Editor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage role-based sidebar tabs and dropdowns.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add role e.g. admin, main_admin, finance"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        />

        <Button type="button" onClick={addRole}>
          Add Role
        </Button>
      </div>

      {Object.keys(config).length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No sidebar roles found.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={resetToDefaultInUI}
            >
              Load Default Roles
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.keys(config).map((role) => (
          <Card key={role}>
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="font-semibold">{role.toUpperCase()}</span>

              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteRole(role)}
              >
                Remove Role
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {(config[role] || []).map((item, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-center">
                    <Input
                      value={item.label}
                      onChange={(e) =>
                        updateItem(role, i, "label", e.target.value)
                      }
                      placeholder="Label"
                    />

                    <Input
                      value={item.path}
                      onChange={(e) =>
                        updateItem(role, i, "path", e.target.value)
                      }
                      placeholder="Path"
                    />

                    <Input
                      value={item.icon}
                      onChange={(e) =>
                        updateItem(role, i, "icon", e.target.value)
                      }
                      placeholder="Icon"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addChildItem(role, i)}
                    >
                      Add Sub Tab
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteItem(role, i)}
                    >
                      Remove
                    </Button>
                  </div>

                  {(item.children || []).map((child, childIndex) => (
                    <div
                      key={childIndex}
                      className="ml-0 md:ml-8 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center rounded-md border bg-muted/30 p-2"
                    >
                      <Input
                        value={child.label}
                        onChange={(e) =>
                          updateChildItem(
                            role,
                            i,
                            childIndex,
                            "label",
                            e.target.value,
                          )
                        }
                        placeholder="Sub Label"
                      />

                      <Input
                        value={child.path}
                        onChange={(e) =>
                          updateChildItem(
                            role,
                            i,
                            childIndex,
                            "path",
                            e.target.value,
                          )
                        }
                        placeholder="Sub Path"
                      />

                      <Input
                        value={child.icon}
                        onChange={(e) =>
                          updateChildItem(
                            role,
                            i,
                            childIndex,
                            "icon",
                            e.target.value,
                          )
                        }
                        placeholder="Sub Icon"
                      />

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => deleteChildItem(role, i, childIndex)}
                      >
                        Remove Sub
                      </Button>
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => addItem(role)}>
                  Add Tab
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addDropdown(role, CONTACTS_DROPDOWN)}
                >
                  Add Contacts Dropdown
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addDropdown(role, FINANCE_DROPDOWN)}
                >
                  Add Finance Dropdown
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={saveConfig} disabled={saving}>
          {saving ? "Saving..." : "Save Config"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={saveDefaultConfig}
          disabled={saving}
        >
          Save Default Sidebar
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={resetToDefaultInUI}
          disabled={saving}
        >
          Reset UI to Default
        </Button>
      </div>
    </div>
  );
}
