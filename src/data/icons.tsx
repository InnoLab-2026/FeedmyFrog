import { Users, Car, ShoppingBag, Briefcase, Baby, GraduationCap } from 'lucide-react';

/** Maps tag names to their icon element. App falls back to <Search> for unknown tags. */
export const iconMap: Record<string, React.ReactNode> = {
  Familie:          <Users className="w-4 h-4" />,
  Kinder:           <Baby className="w-4 h-4" />,
  Mobilität:        <Car className="w-4 h-4" />,
  Verkauf:          <ShoppingBag className="w-4 h-4" />,
  Dienstleistungen: <Briefcase className="w-4 h-4" />,
  Bildung:          <GraduationCap className="w-4 h-4" />,
};
