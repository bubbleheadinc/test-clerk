import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isPublicRoute = createRouteMatcher([
  "/privacy-policy(.*)",
  "/terms-of-service(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    try {
      const { userId, sessionClaims } = await auth();
      console.log("user id", userId);
      console.log("sessionClaims", sessionClaims);
      console.log("is public route", isPublicRoute(req));

      // For users visiting /onboarding, don't try to redirect
      if (userId && isOnboardingRoute(req)) {
        return NextResponse.next();
      }

      if (!isPublicRoute(req)) auth.protect();

      // Catch users who do not have `onboardingComplete: true` in their publicMetadata
      // Redirect them to the /onboarding route to complete onboarding
      if (userId && !sessionClaims?.metadata?.onboardingComplete) {
        console.log("redirecting to onboarding");
        const onboardingUrl = new URL("/onboarding", req.url);
        return NextResponse.redirect(onboardingUrl);
      }

      // If the user is logged in and the route is protected, let them view.
      if (userId && !isPublicRoute(req)) return NextResponse.next();
    } catch (error) {
      console.log(error);
      // auth.protect();
    }
  }
  // { debug: process.env.NODE_ENV === "development" }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    // "/(api|trpc)(.*)",
  ],
};
