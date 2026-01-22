import React from "react";
import { useEffect, useMemo, useState } from "react";

type Project = {
    id: number;
    title: string;
    dueDate?: string; // ISO
    status: "completed" | "in-progress" | "pending";
};

export default function SalesDashboard2() {
    const [projects, setProjects] = useState<Project[]>(() => [
        {
            id: 2,
            title: "Onboarding Flow",
            dueDate: "2024-11-28",
            status: "completed",
        },
        {
            id: 3,
            title: "Build Dashboard",
            dueDate: "2024-11-30",
            status: "in-progress",
        },
        {
            id: 4,
            title: "Optimize Page Load",
            dueDate: "2024-12-05",
            status: "pending",
        },
        {
            id: 5,
            title: "Cross-Browser Testing",
            dueDate: "2024-12-06",
            status: "pending",
        },
    ]);

    const totalProjects = projects.length;
    const endedProjects = projects.filter(
        (p) => p.status === "completed",
    ).length;
    const runningProjects = projects.filter(
        (p) => p.status === "in-progress",
    ).length;
    const pendingProjects = projects.filter(
        (p) => p.status === "pending",
    ).length;

    const today = useMemo(() => new Date(), []);
    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1),
    );
    const [selectedDates, setSelectedDates] = useState<string[]>([]);

    const startOfMonth = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const weeks = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const startDay = start.getDay();
        const days: (Date | null)[] = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let d = 1; d <= end.getDate(); d++) {
            days.push(
                new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    d,
                ),
            );
        }
        while (days.length % 7 !== 0) days.push(null);
        const chunked: (Date | null)[][] = [];
        for (let i = 0; i < days.length; i += 7)
            chunked.push(days.slice(i, i + 7));
        return chunked;
    }, [currentMonth]);

    function toggleDate(date: Date | null) {
        if (!date) return;
        const iso = date.toISOString().slice(0, 10);
        setSelectedDates((prev) =>
            prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso],
        );
    }

    const analytics = useMemo(() => {
        return [20, 60, 80, 75, 45, 10, 30];
    }, []);

    const progressPercent = useMemo(() => {
        if (projects.length === 0) return 0;
        const completed = projects.filter(
            (p) => p.status === "completed",
        ).length;
        return Math.round((completed / projects.length) * 100);
    }, [projects]);

    const [seconds, setSeconds] = useState<number>(5048);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        let t: number | undefined;
        if (running) {
            t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
        }
        return () => {
            if (t) window.clearInterval(t);
        };
    }, [running]);

    function formatHMS(sec: number) {
        const h = Math.floor(sec / 3600)
            .toString()
            .padStart(2, "0");
        const m = Math.floor((sec % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const s = Math.floor(sec % 60)
            .toString()
            .padStart(2, "0");
        return `${h}:${m}:${s}`;
    }

    function resetTimer() {
        setSeconds(0);
        setRunning(false);
    }

    function cycleStatus(id: number) {
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id !== id) return p;
                const next =
                    p.status === "pending"
                        ? "in-progress"
                        : p.status === "in-progress"
                          ? "completed"
                          : "pending";
                return { ...p, status: next };
            }),
        );
    }

    const radius = 72;
    const circumference = 2 * Math.PI * radius;
    const dash = (progressPercent / 100) * circumference;

    return (
        <div className="p-6 bg-white min-h-screen">
            <div className=" mx-auto grid grid-cols-12 gap-6">
                <div className="col-span-3 bg-slate-950 p-6 rounded-2xl shadow-sm ring-1 ring-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-100">
                                Total Projects
                            </p>
                            <h2 className="text-4xl font-bold text-white">
                                {totalProjects}
                            </h2>
                            <p className="text-xs text-gray-300 mt-2">
                                Increased from last month
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-span-3 bg-slate-100 p-6 rounded-2xl shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm text-gray-500">Ended Projects</p>
                    <h2 className="text-3xl font-semibold">{endedProjects}</h2>
                    <p className="text-xs text-gray-400 mt-2">
                        Increased from last month
                    </p>
                </div>

                <div className="col-span-3 bg-slate-100 p-6 rounded-2xl shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm text-gray-500">Running Projects</p>
                    <h2 className="text-3xl font-semibold">
                        {runningProjects}
                    </h2>
                    <p className="text-xs text-gray-400 mt-2">
                        Increased from last month
                    </p>
                </div>

                <div className="col-span-3 bg-slate-100 p-6 rounded-2xl shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm text-gray-500">Pending Project</p>
                    <h2 className="text-3xl font-semibold">
                        {pendingProjects}
                    </h2>
                    <p className="text-xs text-gray-400 mt-2">On Discuss</p>
                </div>

                <div className="col-span-4 bg-slate-50 p-6 rounded-2xl shadow-sm ring-1 ring-gray-200">
                    <p className="text-sm font-medium mb-4">
                        Project Analytics
                    </p>

                    {/* Fixed height container for bars */}
                    <div className="flex items-end justify-between h-48">
                        {[
                            { day: "S", value: 60, striped: true },
                            {
                                day: "M",
                                value: 70,
                                striped: false,
                                color: "bg-[#475569]",
                            },
                            {
                                day: "T",
                                value: 60,
                                striped: false,
                                color: "bg-[#94a3b8]",
                            },
                            {
                                day: "W",
                                value: 85,
                                striped: false,
                                color: "bg-[#0f172a]",
                            },
                            { day: "T", value: 80, striped: true },
                            { day: "F", value: 60, striped: true },
                            { day: "S", value: 75, striped: true },
                        ].map((d, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center h-full"
                            >
                                {/* Bar container */}
                                <div className="flex-1 flex items-end">
                                    <div
                                        className={`w-10 rounded-full relative group ${
                                            d.striped
                                                ? "bg-[repeating-linear-gradient(45deg,#9ca3af_0,#9ca3af_2px,transparent_2px,transparent_6px)]"
                                                : d.color
                                        }`}
                                        style={{ height: `${d.value}%` }}
                                    >
                                        {/* Tooltip */}
                                        {!d.striped && (
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition">
                                                {d.value}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Day label */}
                                <span className="mt-2 text-sm text-gray-500">
                                    {d.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-4 bg-slate-50 p-6 rounded-2xl shadow-sm ring-1 ring-gray-200">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Project</p>
                        <button className="text-sm px-2 py-1 bg-slate-50 text-slate-600 rounded">
                            + New
                        </button>
                    </div>

                    <ul className="mt-4 space-y-3">
                        {projects.map((p) => (
                            <li
                                key={p.id}
                                className="flex items-start justify-between"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {p.title}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Due date: {p.dueDate ?? "-"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${p.status === "completed" ? "bg-slate-200 text-slate-700" : p.status === "in-progress" ? "bg-slate-200 text-slate-700" : "bg-gray-200 text-gray-600"}`}
                                    >
                                        {p.status}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="col-span-4 bg-slate-300 p-4 rounded-2xl shadow-sm ring-1 ring-gray-100">
                    <div className="col-span-8 bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-100">
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() =>
                                            setCurrentMonth(
                                                new Date(
                                                    currentMonth.getFullYear(),
                                                    currentMonth.getMonth() - 1,
                                                    1,
                                                ),
                                            )
                                        }
                                        className="p-2 rounded-lg hover:bg-gray-100"
                                    >
                                        &#8592;
                                    </button>
                                    <div>
                                        <div className="text-sm text-gray-500">
                                            {currentMonth.toLocaleString(
                                                undefined,
                                                { month: "long" },
                                            )}
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {currentMonth.getFullYear()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    Selected: {selectedDates.length}
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center">
                                {["S", "M", "T", "W", "T", "F", "S"].map(
                                    (d) => (
                                        <div
                                            key={d}
                                            className="text-xs text-gray-400"
                                        >
                                            {d}
                                        </div>
                                    ),
                                )}
                            </div>

                            <div className="grid grid-cols-7 gap-1 mt-2">
                                {weeks.map((week, wi) => (
                                    <React.Fragment key={wi}>
                                        {week.map((day, di) => {
                                            const iso = day
                                                ? day.toISOString().slice(0, 10)
                                                : null;
                                            const isToday =
                                                iso ===
                                                today
                                                    .toISOString()
                                                    .slice(0, 10);
                                            const isSelected = iso
                                                ? selectedDates.includes(iso)
                                                : false;
                                            return (
                                                <button
                                                    key={di}
                                                    onClick={() =>
                                                        toggleDate(day)
                                                    }
                                                    className={`h-10 flex items-center justify-center rounded-lg ${day ? "hover:bg-slate-200" : "bg-transparent"} ${isSelected ? "bg-slate-300 text-white" : isToday ? "ring-1 ring-slate-200" : ""}`}
                                                >
                                                    <span
                                                        className={`text-sm ${day ? "text-gray-700" : "text-transparent"}`}
                                                    >
                                                        {day
                                                            ? day.getDate()
                                                            : ""}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 bg-slate-100 p-6 rounded-2xl shadow-sm ring-1 ring-gray-200 flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium">Reminders</p>
                        <h3 className="text-lg font-semibold mt-3">
                            Meeting with Arc Company
                        </h3>
                        <p className="text-sm text-gray-500">
                            Time: 02:00 pm - 04:00 pm
                        </p>
                    </div>
                </div>

                {/* Project Progress Gauge */}
                <div className="col-span-5 bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-200 flex flex-col items-center">
                    <p className="text-sm font-medium mb-2">Project Progress</p>
                    <svg
                        width="200"
                        height="120"
                        viewBox="0 0 200 120"
                        className=""
                    >
                        {/* Background semi-circle */}
                        <path
                            d="M 30 100 A 70 70 0 0 1 170 100"
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="20"
                            strokeLinecap="round"
                        />
                        {/* Progress semi-circle */}
                        <path
                            d="M 30 100 A 70 70 0 0 1 170 100"
                            fill="none"
                            stroke="#08001c"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={Math.PI * 70}
                            strokeDashoffset={
                                Math.PI * 70 -
                                (progressPercent / 100) * Math.PI * 70
                            }
                        />
                    </svg>

                    <div className="text-center -mt-10">
                        <p className="text-3xl font-bold">{progressPercent}%</p>
                        <p className="text-gray-600">Project Ended</p>
                    </div>

                    <div className="flex justify-center gap-4 mt-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-slate-700"></span>{" "}
                            Completed
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-slate-500"></span>{" "}
                            In Progress
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border-2 border-gray-500 border-dashed"></span>{" "}
                            Pending
                        </div>
                    </div>
                </div>

                <div className="col-span-3 bg-slate-800 opacity-100 [background-image:repeating-radial-gradient(circle_at_0_0,transparent_0,#1e293b_14px),repeating-linear-gradient(#cbd5e155,#cbd5e1)] rounded-xl p-4">
                    <p className="text-sm text-white">Time Tracker</p>
                    <div className="text-5xl text-white font-mono mt-12">
                        {formatHMS(seconds)}
                    </div>
                    <div className="mt-3 flex items-center space-x-5">
                        {!running ? (
                            <button
                                onClick={() => setRunning(true)}
                                className="px-7 py-2 rounded-full bg-slate-950 text-white"
                            >
                                Play
                            </button>
                        ) : (
                            <button
                                onClick={() => setRunning(false)}
                                className="px-5 py-2 rounded-full bg-slate-950 text-white"
                            >
                                Pause
                            </button>
                        )}
                        <button
                            onClick={resetTimer}
                            className="px-4 py-2 rounded-full bg-gray-100"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setSeconds((s) => s + 60)}
                            className="px-3 py-2 rounded-full bg-gray-100"
                        >
                            +1m
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
