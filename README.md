# Repro for https://x.com/thefubhy/status/1936485841871773793

## Background

A recent change in [t3.chat](https://t3.chat) introduced Effect (v3.15.5) into the codebase. We're also using uploadthing, which internally uses Effect 3.14.21 (https://github.com/pingdotgg/uploadthing/blob/091b97bcf8bb604ff2f39c19d6cb310c378eaf38/packages/uploadthing/package.json#L161). Uploadthing does not expose effectful APIs to its consumers, hence it's a dependency and not a peer-dependency (a decision we'll probably revise in the next major version). This leads to a potential of multiple versions of effect being included for a single project. While this has some downsides, this is common for many packages (I bet you can find many versions of the same package if you scroll through your lockfile), and should not cause any issues as libraries like uploadthing should be able to use Effect internally without users knowing or caring what version the library might be using.

When it comes to Effect however, they enforce strict version compliance when executing Effects. An effect created by one version of Effect, must be executed by the same version of Effect: 
- https://github.com/Effect-TS/effect/blob/main/packages/effect/src/internal/version.ts
- https://github.com/Effect-TS/effect/blob/main/packages/effect/src/GlobalValue.ts#L17
- https://github.com/Effect-TS/effect/blob/main/packages/effect/src/internal/fiberRuntime.ts#L1372)

> [!NOTE]
> Effect will in the future log at warning level instead of crashing the program https://github.com/Effect-TS/effect/pull/5064. This reproducer also has this patch applied to not crash the app prematurely

To prevent this, we added [`pnpm.overrides`](https://pnpm.io/settings#overrides) to force a single version of Effect in the t3chat repo:

![CleanShot 2025-06-21 at 21 08 23@2x](https://github.com/user-attachments/assets/f315b04f-2682-4b4c-86fa-8b8d7c497a84)

Despite this, module caching led the "old version" included by Uploadthing (3.14.21) to be kept around and included in the deployed output causing the app to crash during generation. 

I was willing to call it a day here, and conclude the issue being cache related. I had several proof of this being the case for t3chat, both locally by running `rm -rf node_modules .next` after changing branches as well as remotely when redeploying an erroneous deployment without build cache. But this is not the end of it, and the Effect folks went ahead and dug deeper.

## The issue at hand

This repo tries to reproduce the issue. While I was not able to reproduce the bad cache behaviors causing the issue with `pnpm.overrides` enabled, I was able to reproduce the core cause of the issue. If we look at the error message from the original tweet by Theo:

```
Cannot execute an Effect versioned 3.16.5 with a Runtime of version 3.14.21
```

This indicates that some bits of UploadThing code executed Effects passed from the application layer. This however, is not the case. No piece of Effect code from the app layer is ever touching the uploadthing layer, so how are Effect's versioned 3.16.5 being executed by Effect 3.14.21? 

### The reproducer

tl;dr - run `pnpm preview`

```
 ✓ Ready in 227ms
Cannot execute an Effect versioned 3.16.8 with a Runtime of version 3.14.21
Cannot execute an Effect versioned 3.16.8 with a Runtime of version 3.14.21
Cannot execute an Effect versioned 3.16.8 with a Runtime of version 3.14.21
Cannot execute an Effect versioned 3.16.8 with a Runtime of version 3.14.21
Cannot execute an Effect versioned 3.16.8 with a Runtime of version 3.14.21
Cannot execute an Effect versioned 3.16.8 with a Runtime of version 3.14.21
Cannot execute an Effect versioned 3.16.8 with a Runtime of version 3.14.21
Cannot execute an Effect versioned 3.16.8 with a Runtime of version 3.14.21
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
Cannot execute an Effect versioned 3.14.21 with a Runtime of version 3.16.8
timestamp=2025-06-21T17:38:49.762Z level=INFO fiber=#2 message="Got data" data=undefined
```

It appears the version of Effect being picked up is non-deterministic. If we look closer to the Next.js compiler we can see that they are doing some form of barrel import optimizations by creating aliases for certain modules ( https://github.com/vercel/next.js/blob/canary/packages/next/src/build/create-compiler-aliases.ts#L163-L165), in particular Effect (https://github.com/vercel/next.js/blob/1f47f8f4809dd43b3223e2fe9d13f7aa1cd47caf/packages/next/src/server/config.ts#L1034-L1053). An example of such generated alias may look like this:

```js
{
  'effect$': '/Users/fubhy/Projects/effect/effect-multiversion-cache-issue/node_modules/.pnpm/effect@3.16.8/node_modules/effect/dist/esm/index.js'
}
```

pnpm puts transitive dependencies inside a nested `node_modules/.pnpm` folder:

![CleanShot 2025-06-21 at 22 14 47@2x](https://github.com/user-attachments/assets/6b529686-3879-4ea9-bd5d-1168f2cd91b7)

But what next isn't taking into account here is that we have 2 versions. As soon as the compiler first generates this alias, all future references will use this aliased path no matter where the source is. So the uploadthing library will sometimes get v3.14.5 and sometimes v3.16.8. With normal module resolution algorithms, the uploadthing code should **always** resolve the `3.14` entrypoints, and the application code should **always** resolve the `3.16` entrypoints.

#3 applies a patch to remove this alias generation and voila... the mismatched version log goes away!

![CleanShot 2025-06-21 at 22 24 54@2x](https://github.com/user-attachments/assets/c7dd13e6-b7ff-4d41-95ea-dd400f447f11)

