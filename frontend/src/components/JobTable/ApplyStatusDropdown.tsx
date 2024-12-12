import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApplyStatusDropdownProps {
    status: string;
    id: string;
    onStatusChange?: (id: string, newStatus: string) => Promise<void>
}

const dropdownItems = [
    { id: 'applied', label: 'Applied' },
    { id: 'not_applied', label: 'Not Applied' },
    { id: 'offered', label: 'Offered' },
    { id: 'interviewing', label: 'Interviewing' },
    { id: 'waiting', label: 'Waiting' }
]

const statusLabelMap = {
    not_applied: "Not Applied",
    applied: "Applied",
    offered: "Offered",
    interviewing: "Interviewing",
    waiting: "Waiting"
}

const ApplyStatusDropDown = ({ id, status, onStatusChange }: ApplyStatusDropdownProps) => {
    console.log(status);
    status = status ?? 'not_applied';
    const handleChange = async (newStatus: string) => {
        try {
            if (onStatusChange) {
                await onStatusChange(id, newStatus);
            }
        } catch (error) {
            console.error('Failed to update status: ', error);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "flex items-center justify-between rounded-full px-3 h-6 text-xs font-medium w-[96px]",
                        status === "applied" && "bg-green-100 text-green-700",
                        status === "not_applied" && "bg-yellow-100 text-yellow-700",
                        status === "interviewing" && "bg-blue-100 text-blue-700",
                        status === "offered" && "bg-purple-100 text-purple-700",
                        status === "waiting" && "bg-orange-100 text-orange-700"
                    )}
                >
                    {statusLabelMap[status]}
                    <ChevronDown className="h-2 w-2 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {dropdownItems.map(item =>
                    <DropdownMenuItem key={item.id} onClick={() => handleChange(item.id)} >
                        {item.label}
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu >
    )
}

export default ApplyStatusDropDown
