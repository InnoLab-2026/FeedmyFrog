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

/** Maps tag names to their icon element. Read it through `iconFor` below. */
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

/**
 * The icon for a tag, or null when there is none.
 *
 * `Object.hasOwn` rather than `iconMap[tag]`: tags are user input and every
 * plain object inherits from Object.prototype, so a tag named `__proto__`
 * would return an object and a tag named `constructor` a function — both of
 * which throw when React tries to render them as a child.
 */
export function iconFor(tag: string): React.ReactNode | null {
  return Object.hasOwn(iconMap, tag) ? iconMap[tag] : null;
}
