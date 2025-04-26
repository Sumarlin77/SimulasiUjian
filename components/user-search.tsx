"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { SearchInput } from "./ui/search-input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card } from "./ui/card";
import { Pagination } from "./ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  UserPlus,
  UserSearch as UserSearchIcon,
  Loader2
} from "lucide-react";

// Define the type for search results
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  universityName: string | null;
  major: string | null;
  image: string | null;
  createdAt: string; // API returns date as string
}

interface SearchResults {
  users: User[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

interface UserSearchProps {
  defaultRole?: UserRole | "ALL";
  showNewButton?: boolean;
  newUserUrl?: string;
  showFilters?: boolean;
  pageSize?: number;
}

export function UserSearch({
  defaultRole,
  showNewButton = true,
  newUserUrl = "/admin/users/new",
  showFilters = true,
  pageSize = 10,
}: UserSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [selectedRole, setSelectedRole] = useState<UserRole | "ALL">((searchParams?.get("role") as UserRole | "ALL") || defaultRole || "ALL");
  const [university, setUniversity] = useState(searchParams?.get("university") || "");
  const [major, setMajor] = useState(searchParams?.get("major") || "");
  const [page, setPage] = useState(Number(searchParams?.get("page") || 1));
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);

  // Load search results based on current filters
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // Build URL with search parameters
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);
        if (selectedRole !== "ALL") params.append("role", selectedRole);
        if (university) params.append("university", university);
        if (major) params.append("major", major);
        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());

        const response = await fetch(`/api/users/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const results = await response.json();
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();

    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedRole !== "ALL") params.set("role", selectedRole);
    if (university) params.set("university", university);
    if (major) params.set("major", major);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [searchQuery, selectedRole, university, major, page, pageSize]);

  // Handle form submit to prevent default behavior
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  // Handle role change
  const handleRoleChange = (value: string) => {
    setSelectedRole(value as UserRole | "ALL");
    setPage(1);
  };

  // Reset all filters
  const handleReset = () => {
    setSearchQuery("");
    setSelectedRole(defaultRole || "ALL");
    setUniversity("");
    setMajor("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daftar Pengguna</h2>
        {showNewButton && (
          <Link href={newUserUrl}>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Tambah User</span>
            </Button>
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari berdasarkan nama atau email..."
          className="w-full"
        />

        {showFilters && (
          <div className="flex flex-wrap gap-4">
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Role</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PARTICIPANT">Peserta</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Universitas"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-[200px]"
            />

            <Input
              placeholder="Jurusan"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-[200px]"
            />

            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        )}
      </form>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searchResults?.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <UserSearchIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="font-medium">Tidak ada pengguna ditemukan</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Coba ubah filter pencarian Anda
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Universitas</TableHead>
                <TableHead>Jurusan</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults?.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name} />
                        <AvatarFallback>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role === "ADMIN" ? "Admin" : "Peserta"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.universityName || "-"}</TableCell>
                  <TableCell>{user.major || "-"}</TableCell>
                  <TableCell>{formatDate(new Date(user.createdAt))}</TableCell>
                  <TableCell>
                    <Link href={`/admin/users/${user.id}`}>
                      <Button size="sm" variant="outline">
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {searchResults && searchResults.pageCount > 1 && (
          <div className="flex items-center justify-center space-x-6 p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {page} dari {searchResults.pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(searchResults.pageCount, p + 1))}
              disabled={page === searchResults.pageCount || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// Import this separate to avoid circular dependency
function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
