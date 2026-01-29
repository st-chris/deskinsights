import { Request, Response, NextFunction, RequestHandler } from 'express';

// Handles try catch block for controllers
// Currently only simple ones, because of parameter typing issues
export const asyncHandler =
  (
    fn: Function // eslint-disable-line @typescript-eslint/no-unsafe-function-type
  ): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Type assertion as per ESLint docs
      await (
        fn as (
          req: Request,
          res: Response,
          next: NextFunction
        ) => Promise<unknown>
      )(req, res, next);
    } catch (error) {
      next(error);
    }
  };
