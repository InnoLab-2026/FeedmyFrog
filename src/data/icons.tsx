import {
  Users,
  Car,
  ShoppingBag,
  Briefcase,
  Baby,
  GraduationCap,
  TrainFront,
  CalendarDays,
  Truck,
} from 'lucide-react';

export const iconMap: Record<string, React.ReactNode> = {
  Familie: <Users className="w-4 h-4" />,
  Kinder: <Baby className="w-4 h-4" />,
  Mobilität: <Car className="w-4 h-4" />,
  Pendeln: <TrainFront className="w-4 h-4" />,
  Verkauf: <ShoppingBag className="w-4 h-4" />,
  Dienstleistungen: <Briefcase className="w-4 h-4" />,
  Bildung: <GraduationCap className="w-4 h-4" />,
  Wochenende: <CalendarDays className="w-4 h-4" />,
  Transport: <Truck className="w-4 h-4" />,
};