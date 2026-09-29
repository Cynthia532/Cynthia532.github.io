# 概念图生成记录

日期：2026-09-29。

使用内置 `image_gen` 工具生成；未使用 CLI / API fallback。图片用于设计讨论，尚非实际 3D 模型或可运行页面。

## 角色设定图

- 输出：[concepts/avatar-v1.png](concepts/avatar-v1.png)
- 参考：用户提供的个人照片，仅参考人物外观与穿着。原照片未复制到仓库。
- 检视：包含主体、正侧背视图、服装变体、表情和配色。图中背包、变体裤鞋颜色和少量布料纹理属于生成的表现细节，首版建模以 `avatar-spec.md` 的范围为准；优先哑光简洁材质，裤鞋默认保持统一。
- 下方是实际发送给工具的完整提示词。

```text
Use case: stylized-concept.
Asset type: original 3D avatar character design sheet for Zhixin's interactive academic homepage; a visual modeling brief, not an existing game character.
Input image: the supplied personal photograph is a reference for this person's visible appearance and outfit cues only. Do not reproduce the photo background or brand lettering.
Primary request: translate the woman in the reference into a charming original human avatar in a cozy life-simulation, rounded geometric low-poly aesthetic inspired by Animal Crossing's approachable proportions, with candy colors and soft matte toy materials. Preserve recognizable cues: natural dark almond-shaped eyes (not enormous anime eyes), a gentle rounded oval face, straight dark brown-black hair with cheek-framing strands, understated closed-mouth smile, navy baseball cap, pale gray sweatshirt over a light blue collar, and lime-green lanyard. Keep a human character. Body approximately 2.7 heads tall, large softly rounded head, short capsule limbs, small mitten hands, simplified solid hair masses. Simplify the lanyard to a mint-lime strap with a small plain rounded badge, without text or logos. The unseen lower body is a proposed design: muted slate relaxed trousers, off-white sneakers with mint details. Cap has a small plain mint geometric stitched accent instead of a wordmark.
Composition: landscape professional character design board, warm ivory background, generous whitespace. On the left one large friendly three-quarter full-body hero pose, eyes toward viewer. In the middle three smaller consistent full-body views of the SAME default character: front, side, back; arms slightly out for modeling. On the right two smaller full-body clothing variants of the SAME person: lavender beret with pale pink cardigan, then mint bucket hat with butter-yellow hoodie. Default dark cap plus gray-blue layers remain the main design. Along the bottom small candy palette swatches and three tiny face expressions (neutral, smile, focused) keeping face identity consistent. Do not crop shoes or hat. All views share the exact same face, body proportions, and hair. Hair behind the head is a simple low tied-back shape, a design proposal.
Style: polished but actually modelable game asset, clean bevels, smooth broad faces, readable silhouette, subtle ambient occlusion and soft studio shadows, restrained detail. No realistic skin pores, no individual hair strands, no fuzzy fabric texture. Avoid glossy plastic, neon cyberpunk, photorealism, overly busy ornament, baby features, gigantic sparkling anime eyes. No typography or watermark.
```

## 门口与房间概念图

- 输出：[concepts/room-v1.png](concepts/room-v1.png)
- 参考：上述角色设定图，用于统一小人外观和材料方向。
- 检视：门口和房间两视图、独立门铃、两份 CN / EN 简历、书架与可换装衣柜均已呈现。它是构图与配色提案；实际交互的文字提示、开门方向、角色碰撞空间和镜头需要在原型中实现与验证。
- 下方是实际发送给工具的完整提示词。

```text
Use case: stylized-concept.
Asset type: environment concept board for Zhixin's proposed interactive 3D personal academic homepage, matching the supplied avatar character sheet.
Input image 1 is a character identity and material reference: use exactly this human character design, navy cap, dark low tied hair, gray sweatshirt over blue collar, mint lanyard, slate trousers and white-mint shoes. Simplify fabric to clean matte game geometry.
Primary request: design a small inviting candy-colored personal study that a visitor can enter. Original cozy life-simulation game visual language, rounded low-poly / beveled geometry, friendly toy scale, soft warm lighting.
Composition: one elegant landscape concept board with two separate clear panels and generous ivory margins. Left panel approximately one third of board: exterior doorway view, cream walls, arched mint door with a real visible hinge side and handle, a separate prominent strawberry-pink doorbell on adjacent wall, warm butter-yellow wall light, small doormat, same default avatar standing beside the door waving, full body. The exterior communicates an approachable choice to enter or ring the bell. Right panel approximately two thirds: a large elevated three-quarter cutaway view of the SAME small single-room study, no roof, near wall removed only for presentation. A clearly visible inward-open mint entrance door near the front edge connects to the doorway idea. Place the avatar on the room floor near the central desk, with ample floor clearance. Center desk has EXACTLY TWO separate loose cream resume sheets: one with pink clip and a simple 'CN' label, one with sky-blue clip and an 'EN' label, both visibly clickable and separated. Bookshelves around the back walls, one group for blog books and another for papers, with pastel-colored books and a few blank frames. A small rounded lavender wardrobe on one side, doors slightly open so spare beret, mint bucket hat, pink cardigan and butter-yellow hoodie are visible; include a simple inset mirror. Soft pale wood floor, cream walls, mint trim, pastel rug, a rounded window with daylight. Furniture is sparse enough to walk between. Add only a few restrained plant or lamp accents.
Palette: ivory #FFF4DE, mint #A9DFC5, strawberry #F2B6C8, sky #ABD4EE, butter #F4D982, lavender #C7B8E7, navy #303B59 accents. Soft matte surfaces, simple meshes, baked-looking ambient shadows, clear silhouettes. It should look achievable as a lightweight browser 3D scene, not a photorealistic room.
Keep all full characters and furniture inside panels. Do not add other people. No HUD, no website browser chrome, no callout lines, no paragraphs or title text, no logos, no watermark. Only small CN and EN labels on the two paper sheets. This is a concept illustration, not a screenshot of a built product.
```
