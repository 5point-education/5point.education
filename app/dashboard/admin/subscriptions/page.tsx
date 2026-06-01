"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
    Crown,
    Plus,
    Pencil,
    X,
    Check,
    Infinity,
    Clock,
    Users,
    Loader2,
    Shield,
    Sparkles,
    AlertTriangle,
} from "lucide-react";

interface SubscriptionTier {
    id: string;
    name: string;
    durationMonths: number | null;
    isActive: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
    _count?: { subscriptions: number };
}

export default function SubscriptionManagementPage() {
    const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // New tier form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDuration, setNewDuration] = useState<string>("");
    const [newIsUnlimited, setNewIsUnlimited] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDuration, setEditDuration] = useState<string>("");
    const [editIsUnlimited, setEditIsUnlimited] = useState(false);

    const fetchTiers = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/subscriptions");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setTiers(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load subscription tiers" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTiers();
    }, [fetchTiers]);

    const handleAddTier = async () => {
        if (!newName.trim()) {
            toast({ variant: "destructive", title: "Name required" });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName.trim(),
                    durationMonths: newIsUnlimited ? null : parseInt(newDuration) || 1,
                    displayOrder: tiers.length + 1,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            toast({ title: "Tier created", description: `"${newName}" has been added.` });
            setShowAddForm(false);
            setNewName("");
            setNewDuration("");
            setNewIsUnlimited(false);
            fetchTiers();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateTier = async (id: string) => {
        if (!editName.trim()) {
            toast({ variant: "destructive", title: "Name required" });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/subscriptions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    durationMonths: editIsUnlimited ? null : parseInt(editDuration) || 1,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            toast({ title: "Tier updated" });
            setEditingId(null);
            fetchTiers();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (id: string, currentlyActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/subscriptions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentlyActive }),
            });

            if (!res.ok) throw new Error("Failed to update");

            toast({
                title: currentlyActive ? "Tier disabled" : "Tier enabled",
                description: currentlyActive
                    ? "Existing students keep their subscription. New assignments disabled."
                    : "This tier is now available for assignment.",
            });
            fetchTiers();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update tier status" });
        }
    };

    const startEdit = (tier: SubscriptionTier) => {
        setEditingId(tier.id);
        setEditName(tier.name);
        setEditDuration(tier.durationMonths?.toString() || "");
        setEditIsUnlimited(tier.durationMonths === null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditDuration("");
        setEditIsUnlimited(false);
    };

    const getTierIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("premium") || lower.includes("unlimited")) return Sparkles;
        if (lower.includes("prime") || lower.includes("pro")) return Crown;
        return Shield;
    };

    const getTierGradient = (name: string, isActive: boolean) => {
        if (!isActive) return "from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900";
        const lower = name.toLowerCase();
        if (lower.includes("premium") || lower.includes("unlimited"))
            return "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20";
        if (lower.includes("prime") || lower.includes("pro"))
            return "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20";
        return "from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/20";
    };

    const getTierAccent = (name: string, isActive: boolean) => {
        if (!isActive) return "text-gray-400";
        const lower = name.toLowerCase();
        if (lower.includes("premium") || lower.includes("unlimited")) return "text-amber-600 dark:text-amber-400";
        if (lower.includes("prime") || lower.includes("pro")) return "text-violet-600 dark:text-violet-400";
        return "text-blue-600 dark:text-blue-400";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500 text-sm font-medium">Loading subscription tiers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Crown className="h-8 w-8 text-amber-500" />
                            Subscriptions
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                            Manage subscription tiers for student analytics access
                        </p>
                    </div>
                    {!showAddForm && (
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 rounded-xl gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Tier
                        </Button>
                    )}
                </div>

                {/* Add New Tier Form */}
                {showAddForm && (
                    <Card className="border-2 border-dashed border-primary/30 bg-primary/5 shadow-none rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                New Subscription Tier
                            </CardTitle>
                            <CardDescription>Define a new tier with a name and duration.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="new-tier-name">Tier Name</Label>
                                    <Input
                                        id="new-tier-name"
                                        placeholder='e.g. "Gold"'
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration</Label>
                                    {newIsUnlimited ? (
                                        <div className="flex items-center gap-2 h-10 px-3 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                                            <Infinity className="h-4 w-4 text-amber-600" />
                                            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                                Unlimited
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="Months"
                                                value={newDuration}
                                                onChange={(e) => setNewDuration(e.target.value)}
                                                className="rounded-xl pr-16"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                months
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Switch
                                            id="new-unlimited"
                                            checked={newIsUnlimited}
                                            onCheckedChange={setNewIsUnlimited}
                                        />
                                        <Label htmlFor="new-unlimited" className="text-xs text-gray-500 cursor-pointer">
                                            Unlimited access
                                        </Label>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleAddTier} disabled={saving} className="flex-1 rounded-xl">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        <span className="ml-1">Save</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setNewName("");
                                            setNewDuration("");
                                            setNewIsUnlimited(false);
                                        }}
                                        className="rounded-xl"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tier Cards */}
                {tiers.length === 0 ? (
                    <Card className="border-0 shadow-md rounded-2xl">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Crown className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600">No tiers configured</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Create your first subscription tier to get started.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {tiers.map((tier) => {
                            const TierIcon = getTierIcon(tier.name);
                            const isEditing = editingId === tier.id;

                            return (
                                <Card
                                    key={tier.id}
                                    className={`border-0 shadow-md rounded-2xl bg-gradient-to-r ${getTierGradient(tier.name, tier.isActive)} transition-all duration-200 hover:shadow-lg ${!tier.isActive ? "opacity-70" : ""}`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            {/* Icon */}
                                            <div
                                                className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${tier.isActive ? "bg-white/80 dark:bg-white/10 shadow-sm" : "bg-gray-200/50 dark:bg-gray-700/30"}`}
                                            >
                                                <TierIcon className={`h-7 w-7 ${getTierAccent(tier.name, tier.isActive)}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <div className="grid sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-gray-500">Tier Name</Label>
                                                            <Input
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className="rounded-lg h-9"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-gray-500">Duration</Label>
                                                            {editIsUnlimited ? (
                                                                <div className="flex items-center gap-2 h-9 px-3 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                                                                    <Infinity className="h-3.5 w-3.5 text-amber-600" />
                                                                    <span className="text-xs font-medium text-amber-700">
                                                                        Unlimited
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        value={editDuration}
                                                                        onChange={(e) => setEditDuration(e.target.value)}
                                                                        className="rounded-lg h-9 pr-16"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                                        months
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Switch
                                                                    id={`edit-unlimited-${tier.id}`}
                                                                    checked={editIsUnlimited}
                                                                    onCheckedChange={setEditIsUnlimited}
                                                                />
                                                                <Label
                                                                    htmlFor={`edit-unlimited-${tier.id}`}
                                                                    className="text-[10px] text-gray-500 cursor-pointer"
                                                                >
                                                                    Unlimited
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                                {tier.name}
                                                            </h3>
                                                            {!tier.isActive && (
                                                                <Badge variant="secondary" className="text-[10px] bg-gray-200 dark:bg-gray-700">
                                                                    Disabled
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1.5">
                                                                {tier.durationMonths === null ? (
                                                                    <>
                                                                        <Infinity className="h-3.5 w-3.5 text-amber-500" />
                                                                        Unlimited access
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Clock className="h-3.5 w-3.5" />
                                                                        {tier.durationMonths} month{tier.durationMonths !== 1 ? "s" : ""}
                                                                    </>
                                                                )}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Users className="h-3.5 w-3.5" />
                                                                {tier._count?.subscriptions || 0} student{(tier._count?.subscriptions || 0) !== 1 ? "s" : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {isEditing ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUpdateTier(tier.id)}
                                                            disabled={saving}
                                                            className="rounded-lg gap-1"
                                                        >
                                                            {saving ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                            Save
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={cancelEdit} className="rounded-lg">
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => startEdit(tier)}
                                                            className="rounded-lg gap-1 text-gray-600 hover:text-primary"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            Edit
                                                        </Button>
                                                        <div className="flex items-center gap-2 border-l pl-2 ml-1">
                                                            <Switch
                                                                id={`active-${tier.id}`}
                                                                checked={tier.isActive}
                                                                onCheckedChange={() => handleToggleActive(tier.id, tier.isActive)}
                                                            />
                                                            <Label
                                                                htmlFor={`active-${tier.id}`}
                                                                className="text-xs text-gray-500 cursor-pointer whitespace-nowrap"
                                                            >
                                                                {tier.isActive ? "Active" : "Disabled"}
                                                            </Label>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Info Card */}
                <Card className="border-0 shadow-sm rounded-2xl bg-amber-50/50 dark:bg-amber-950/10">
                    <CardContent className="p-5 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                            <p className="font-semibold">About disabling tiers</p>
                            <p className="text-amber-700/80 dark:text-amber-400/70 text-xs leading-relaxed">
                                Disabling a tier hides it from new assignments but does <strong>not</strong> affect existing
                                students. Their subscriptions continue to operate normally until expiry or manual change.
                                Tiers are never deleted to preserve data integrity.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
