"use client";

import { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableShell, TruncateCell } from "@/components/data-table-shell";
import { ArrowLeft, AlertCircle, Fingerprint } from "lucide-react";
import { useAnonymousDevices } from "@/hooks/use-anonymous-devices";

export default function AnonymousUsersPage() {
  const [page, setPage] = useState(1);
  const [fingerprint, setFingerprint] = useState("");
  const [claimedFilter, setClaimedFilter] = useState<"all" | "yes" | "no">("no");
  const { devices, total, totalPages, loading, error, refetch } = useAnonymousDevices({
    page,
    limit: 20,
    fingerprint: fingerprint || undefined,
    claimed: claimedFilter === "all" ? undefined : claimedFilter === "yes",
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/users">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight mt-2">Anonymous visitors</h1>
            <p className="text-muted-foreground">
              Visitors who haven&apos;t created an account yet, identified by a per-device
              fingerprint the app and website already attach to every request. Once someone
              signs up or logs in from a device, their anonymous history is folded into their
              account and the device shows here as &quot;Linked&quot;.
            </p>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading anonymous visitors</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                  Try again
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Anonymous devices
              </CardTitle>
              <CardDescription>
                {total.toLocaleString()} device{total !== 1 ? "s" : ""} matching the current filters.
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Input
                  placeholder="Search by fingerprint..."
                  value={fingerprint}
                  onChange={(e) => {
                    setFingerprint(e.target.value);
                    setPage(1);
                  }}
                  className="sm:max-w-xs"
                />
                <Select
                  value={claimedFilter}
                  onValueChange={(v: "all" | "yes" | "no") => {
                    setClaimedFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Anonymous only (not signed up)</SelectItem>
                    <SelectItem value="yes">Linked to an account</SelectItem>
                    <SelectItem value="all">All devices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DataTableShell
                minWidth="840px"
                loading={loading}
                empty={!loading && devices.length === 0}
                emptyMessage="No anonymous devices found matching your filters."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fingerprint</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>First seen</TableHead>
                      <TableHead>Last seen</TableHead>
                      <TableHead>Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <TruncateCell
                            className="font-mono text-xs"
                            title={device.fingerprint_hash}
                          >
                            {device.fingerprint_hash}
                          </TruncateCell>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{device.os || "Unknown OS"}</div>
                          <div className="text-xs text-muted-foreground">
                            {device.browser || "—"}
                            {device.locale ? ` · ${device.locale}` : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          {device.claimed ? (
                            <Badge className="bg-green-100 text-green-800">Linked</Badge>
                          ) : (
                            <Badge variant="secondary">Anonymous</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(device.first_seen_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(device.last_seen_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {device._count.activity_logs.toLocaleString()} request
                          {device._count.activity_logs !== 1 ? "s" : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTableShell>

              {totalPages > 1 && !loading && (
                <div className="flex items-center justify-between gap-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} · {total.toLocaleString()} total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
