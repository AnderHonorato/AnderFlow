import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'

type Handler = (req: NextRequest, context?: any) => Promise<NextResponse>

export function validateRequest(schema: ZodSchema) {
  return function validationMiddleware(handler: Handler): Handler {
    return async (req: NextRequest, context?: any) => {
      try {
        const body = await req.json().catch(() => null)

        const result = schema.safeParse(body ?? {})

        if (!result.success) {
          return NextResponse.json(
            {
              error: 'Dados invalidos',
              details: result.error.flatten().fieldErrors,
            },
            { status: 400 }
          )
        }

        ;(req as any).validatedData = result.data

        return handler(req, context)
      } catch (error) {
        console.error('[validateRequest]', error)
        return NextResponse.json({ error: 'Erro ao validar dados' }, { status: 400 })
      }
    }
  }
}

export function composeMiddlewares(
  middlewares: Array<(handler: Handler) => Handler>,
  handler: Handler
): Handler {
  return middlewares.reduceRight(
    (composed, middleware) => middleware(composed),
    handler
  )
}
