'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModeToggle } from './mode-toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { io, Socket } from 'socket.io-client';

interface Student {
  student_id: number;
  first_name: string;
  last_name: string;
  program: string;
  email: string;
  isClaimed: boolean;
  claimedByOfficer?: string;
}

interface Claim {
    id: number;
    student_id: number;
    officer_name: string;
    tinsel_day: number;
    food_claimed: string;
    first_name?: string;
    last_name?: string;
}

interface MainInterfaceProps {
  officerName: string;
}

export default function MainInterface({ officerName }: MainInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  useEffect(() => {
    // Show login notice
    const shouldShowNotice = sessionStorage.getItem('showLoginNotice');
    if (shouldShowNotice) {
      setShowNoticeModal(true);
      sessionStorage.removeItem('showLoginNotice');
    }

    // Fetch initial recent claims
    async function fetchRecentClaims() {
        try {
            const response = await fetch('/api/claims/recent');
            if(response.ok) {
                const data = await response.json();
                setRecentClaims(data);
            }
        } catch (error) {
            console.error('Error fetching recent claims:', error);
        }
    }
    fetchRecentClaims();

    // Setup websocket
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('new-claim', (newClaim: Claim) => {
      setRecentClaims((prevClaims) => [newClaim, ...prevClaims].slice(0, 10));
      // Also update search results if the claimed student is in the list
      setSearchResults(prevResults => prevResults.map(student => 
        student.student_id === newClaim.student_id 
          ? { ...student, isClaimed: true, claimedByOfficer: newClaim.officer_name } 
          : student
      ));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    async function fetchStudents() {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(`/api/students/search?query=${debouncedSearchTerm}`);
        
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Error searching for students: Server returned non-JSON response.', text);
            setSearchResults([]);
            return;
        }

        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching for students:', error);
      } finally {
        setIsSearching(false);
      }
    }
    fetchStudents();
  }, [debouncedSearchTerm]);

  const handleClaim = async (studentId: number) => {
    const toastId = toast.loading('Processing claim...');
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Error claiming food: Server returned non-JSON response.', text);
        toast.error('An unexpected error occurred.', { id: toastId });
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || 'Failed to claim.', { id: toastId });
      } else {
        toast.success(`Successfully claimed ${data.claim.food_claimed}!`, { id: toastId });
        setSearchResults(prevResults => prevResults.map(student => 
            student.student_id === studentId 
              ? { ...student, isClaimed: true, claimedByOfficer: officerName } 
              : student
        ));
      }
    } catch (error) {
      console.error('Error claiming food:', error);
      toast.error('An error occurred while claiming food.', { id: toastId });
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <Dialog open={showNoticeModal} onOpenChange={setShowNoticeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How This App Works</DialogTitle>
            <DialogDescription>
              A quick guide for officers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p><b>1. Search:</b> Find a student by their name or ID number.</p>
            <p><b>2. Claim:</b> Click the "Claim" button to record their meal.</p>
            <p className="font-bold text-destructive pt-2">Important: Clicking "Claim" immediately sends an email confirmation to the student.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNoticeModal(false)}>I Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">Tinsel Treats Claiming</h1>
        <div className="flex items-center gap-4">
          <p>Welcome, {officerName}</p>
          <a href="/api/auth/logout">
            <Button variant="outline">Logout</Button>
          </a>
          <ModeToggle />
        </div>
      </header>

      <Tabs defaultValue="search" className="w-full flex flex-col flex-grow min-h-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="claims">Recent Claims</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="flex-grow overflow-auto">
            <div className="py-4">
                <Input
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && <p className="p-4">Searching...</p>}
                <div className="mt-4 space-y-2">
                    {searchResults.map((student) => (
                    <div key={student.student_id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                        <p className="font-bold">{student.first_name} {student.last_name}</p>
                        <p className="text-sm text-gray-500">{student.student_id} - {student.program}</p>
                        </div>
                        {student.isClaimed ? (
                        <Button variant="outline" disabled>Claimed by {student.claimedByOfficer}</Button>
                        ) : (
                        <Button onClick={() => handleClaim(student.student_id)}>Claim</Button>
                        )}
                    </div>
                    ))}
                </div>
            </div>
        </TabsContent>
        <TabsContent value="claims" className="flex-grow overflow-auto">
            <div className="py-4">
                <ul className="space-y-3">
                    {recentClaims.map((claim) => (
                    <li key={claim.id} className="text-sm p-3 border rounded-lg">
                        <p><b>{claim.first_name || 'Unknown'} {claim.last_name || ''}</b> claimed <b>{claim.food_claimed}</b>.</p>
                        <p className="text-xs text-gray-500">Student ID: {claim.student_id} | Officer: {claim.officer_name}</p>
                    </li>
                    ))}
                </ul>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}