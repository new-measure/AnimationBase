# 3D product and scene

Rendered objects and worlds: floating devices, glass logos, voxel icons, toy-like dioramas, x-ray products. The
catalog splits into **stylised** 3D, which a 2.5D or simple WebGL layer can approximate, and **photoreal** 3D, which
needs a real renderer and is out of scope.

**In the catalog:** 106 films (4.8%). Median length 0:35, with the middle half between 0:22 and 1:10.
- Background: dark 43%, light 22%, photo 22%.
- Text: none 55%.
- Overlays: text 26%, UI 16%, logo 15%.
- Aspect: 91% landscape.
- Categories: other 23%, AI 23%, design 16%, hardware 11%.
- Code can make it: 43 partial (stylised), 63 no (photoreal).

## What it looks like (from the representatives)

- **A hero object floating in space on a plain ground,** turning slowly: a tiny laptop over a disc
  ([Ubuntu 26.04](https://whatships.com/videos/ubuntu-26-04-lts-resolute-raccoon/)), a film box
  ([Roll](https://whatships.com/videos/roll/)), an x-ray device ([Next iPod](https://whatships.com/videos/next-ipod/)).
- **Glass and chrome logos** beside flat icons ([Utapp](https://whatships.com/videos/utapp/)).
- **A tilted phone with the product UI** on its screen ([Co-Invest iMessage](https://whatships.com/videos/co-invest-imessage/)).
- **Voxel or low-poly icon sets** ([Voxel icon skill](https://whatships.com/videos/voxel-icon-skill/)), and toy
  dioramas ([PancakeSwap Perps](https://whatships.com/videos/pancakeswap-perps/)).

## What's reachable

- **With 2.5D DOM (have):** a phone or laptop as layered, tilted planes with the UI on the screen plane, a device frame
  with a reflection sweep, and card stacks in perspective. That covers the "tilted device with UI" look.
- **With a WebGL layer (build, Phase 2 option):**
  - Simple geometry (boxes, rounded slabs, extruded logos, voxels) with a studio-light look: soft shadows, matcap or
    glass shaders.
  - Scenes are pure functions of `t` (camera and object transforms from `t`), rendered into a canvas layer.
  - This covers the floating hero objects and voxel icons.
- **Not reachable:** photoreal products, CG characters and cinematic environments. Supply renders or footage and
  composite them ([footage_overlays.md](footage_overlays.md)).

## Beats

1. **Reveal:** the object comes out of darkness, with a light sweep or a rotation into its hero angle.
2. **Detail:** push in on one feature, or the object opens or explodes into parts.
3. **Context:** the object with the UI, or in use.
4. **End card:** a logo, often the object itself becoming the mark.

## Pitfalls

- Fake 3D through CSS on complex shapes. It breaks at angles. Keep CSS 3D to planes, and use WebGL for volumes.
- Spinning for its own sake. A rotation should reveal something.

Representatives: [refs/whatships/genres.md](../../refs/whatships/genres.md#3d-product-and-scene-106).
