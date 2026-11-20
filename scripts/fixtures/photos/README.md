# Demo photographs

These twenty-seven photographs were selected by the project owner for fictional demo profiles.
The people pictured are not represented as actual Chiron staff or endorsers.

The local JPEGs are square and at most 1024 x 1024. Preparation includes cropping, resizing when needed,
JPEG re-encoding and metadata removal.
The application creates its normal 64 x 64 and 512 x 512 variants through the upload API.
Original download URLs where available, exact source crop rectangles and profile assignments are recorded in
`sources.json`. Crop coordinates refer to the downloaded image; a null crop means the centered square.
Pexels downloads used the image CDN's width/compression parameters before local preparation.

- Seventeen images are from [Pexels](https://www.pexels.com/license/); individual photo pages are in `sources.json`.
- The clinic portrait used for Sofia Orlova is from [Pixabay](https://pixabay.com/photos/dog-5969008/),
  under the [Pixabay Content License](https://pixabay.com/service/license-summary/).
- `veterinarians/alina-zaitseva.jpg`: **Yulia Bublikova portrait 2021**, author **BublikovaYulia**,
  [source](https://commons.wikimedia.org/wiki/File:Yulia_Bublikova_portrait_2021.jpg),
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- `veterinarians/denis-savin.jpg`: **Dr. Azmat Ullah Khan**, author **Waqasbinniaz**,
  [source](https://commons.wikimedia.org/wiki/File:Dr._Azmat_Ullah_Khan_.jpg),
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

The two Wikimedia-derived JPEGs, including the cropped/resized variants generated from them, remain
under CC BY-SA 4.0. Retain the corresponding source, author, license and modification notices when distributing them.
This image license does not change the license of the application code.

The eight doctors and nineteen pets each have an individual portrait assigned by profile ID. The pets include
seven dogs, seven cats, two guinea pigs, one rabbit, one ferret and one parrot. Seven pet photos were supplied as
attachments by the project owner. Original source and licensing information were unavailable for those photos.

`../photo-a.png` and `../photo-b.png` are synthetic images used only for API regression checks
and recognition of placeholders from older demo installations. They are not assigned to demo profiles.
