import type { VariantProps } from 'class-variance-authority'
import { Link, type LinkProps } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LinkButtonProps = LinkProps & Pick<VariantProps<typeof buttonVariants>, 'variant' | 'size'>

/** A router link that looks like a Button: for navigation, where a <button> would be wrong. */
export function LinkButton({ variant = 'default', size = 'lg', className, ...props }: LinkButtonProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
