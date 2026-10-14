import type { CSSProperties } from 'react'
import tabbyFace from '../../../../product/brand/tabby-face.png'
import valHeartEyes from '../assets/seasonal-icons/valentines-heart-eyes.png'
import valHeartHoodie from '../assets/seasonal-icons/valentines-heart-hoodie.png'
import valLoveBow from '../assets/seasonal-icons/valentines-love-bow.png'
import stPatricksShamrock from '../assets/seasonal-icons/st-patricks-shamrock.png'
import stPatricksLuckyHat from '../assets/seasonal-icons/st-patricks-lucky-hat.png'
import stPatricksShamrockHoodie from '../assets/seasonal-icons/st-patricks-shamrock-hoodie.png'
import easterBunnyEars from '../assets/seasonal-icons/easter-bunny-ears.png'
import easterChickHoodie from '../assets/seasonal-icons/easter-chick-hoodie.png'
import easterPaintedEgg from '../assets/seasonal-icons/easter-painted-egg.png'
import thanksgivingHarvestLeaf from '../assets/seasonal-icons/thanksgiving-harvest-leaf.png'
import thanksgivingHarvestScarf from '../assets/seasonal-icons/thanksgiving-harvest-scarf.png'
import thanksgivingPumpkinHoodie from '../assets/seasonal-icons/thanksgiving-pumpkin-hoodie.png'
import halloweenWitchHat from '../assets/seasonal-icons/halloween-witch-hat.png'
import halloweenFangs from '../assets/seasonal-icons/halloween-fangs.png'
import halloweenFrankensteinHoodie from '../assets/seasonal-icons/halloween-frankenstein-hoodie.png'
import christmasSantaHat from '../assets/seasonal-icons/christmas-santa-hat.png'
import christmasCandyCaneScarf from '../assets/seasonal-icons/christmas-candy-cane-scarf.png'
import christmasReindeer from '../assets/seasonal-icons/christmas-reindeer.png'

type IconOption = {
  image: string
  title: string
  description: string
}

type HolidayGroup = {
  id: string
  name: string
  date: string
  detail?: string
  accent: string
  wash: string
  concepts: IconOption[]
}

const holidays: HolidayGroup[] = [
  {
    id: 'valentines',
    name: "Valentine's Day",
    date: 'Feb 14',
    accent: '#d64b72',
    wash: '#fbe9ee',
    concepts: [
      {
        image: valHeartEyes,
        title: 'Heart eyes',
        description: 'Oversized, glossy hearts replace Tabby’s eyes.',
      },
      {
        image: valHeartHoodie,
        title: 'Heart hoodie',
        description: 'A heart-shaped pink hood surrounds Tabby’s face.',
      },
      {
        image: valLoveBow,
        title: 'Love bow',
        description: 'A satin bow tie sits on a fitted pink collar.',
      },
    ],
  },
  {
    id: 'st-patricks',
    name: "St. Patrick's Day",
    date: 'Mar 17',
    accent: '#39835e',
    wash: '#e8f1e9',
    concepts: [
      {
        image: stPatricksShamrock,
        title: 'Shamrock scarf',
        description: 'A green neckerchief has clovers woven into the fabric.',
      },
      {
        image: stPatricksLuckyHat,
        title: 'Leprechaun hat',
        description: 'Tabby’s ears come through the fitted green cap.',
      },
      {
        image: stPatricksShamrockHoodie,
        title: 'Shamrock hoodie',
        description:
          'A bright green hood frames Tabby’s face with a bold clover.',
      },
    ],
  },
  {
    id: 'easter',
    name: 'Easter',
    date: 'Date varies',
    detail: 'Western and Orthodox Easter can fall on different dates.',
    accent: '#6e80a5',
    wash: '#edf0f6',
    concepts: [
      {
        image: easterBunnyEars,
        title: 'Bunny ears',
        description:
          'A pink headband puts plush bunny ears behind Tabby’s own.',
      },
      {
        image: easterChickHoodie,
        title: 'Chick hoodie',
        description:
          'A bright yellow chick hood frames Tabby’s face around a big orange beak.',
      },
      {
        image: easterPaintedEgg,
        title: 'Painted egg',
        description: 'A pastel shell wraps around Tabby like a hood.',
      },
    ],
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    date: 'Date varies',
    detail:
      'US: fourth Thursday in November. Canada: second Monday in October.',
    accent: '#bc742d',
    wash: '#f7eee1',
    concepts: [
      {
        image: thanksgivingHarvestLeaf,
        title: 'Harvest leaf',
        description: 'A fitted autumn band carries a maple-leaf crown.',
      },
      {
        image: thanksgivingHarvestScarf,
        title: 'Harvest scarf',
        description: 'A plaid scarf wraps naturally below Tabby’s jaw.',
      },
      {
        image: thanksgivingPumpkinHoodie,
        title: 'Pumpkin hoodie',
        description:
          'A ribbed orange pumpkin hood frames Tabby’s face under a leafy stem.',
      },
    ],
  },
  {
    id: 'halloween',
    name: 'Halloween',
    date: 'Oct 31',
    accent: '#dc742d',
    wash: '#f8ece3',
    concepts: [
      {
        image: halloweenWitchHat,
        title: 'Witch hat',
        description: 'A purple hat fits between Tabby’s ears.',
      },
      {
        image: halloweenFangs,
        title: 'Vampire fangs',
        description:
          'A red velvet cape and tall black collar frame Tabby’s fangs.',
      },
      {
        image: halloweenFrankensteinHoodie,
        title: 'Frankenstein hoodie',
        description:
          'A green monster hood adds a black flat-top and silver bolts.',
      },
    ],
  },
  {
    id: 'christmas',
    name: 'Christmas',
    date: 'Dec 25',
    accent: '#b9475b',
    wash: '#f7e9e9',
    concepts: [
      {
        image: christmasSantaHat,
        title: 'Santa hat',
        description: 'A red cap fits around Tabby’s ears.',
      },
      {
        image: christmasCandyCaneScarf,
        title: 'Candy cane scarf',
        description: 'A wide red-and-white scarf wraps below Tabby’s smile.',
      },
      {
        image: christmasReindeer,
        title: 'Reindeer Tabby',
        description: 'A fitted band carries antlers and a red nose.',
      },
    ],
  },
]

const SeasonalIcon = ({
  image,
  size,
  label,
}: {
  image: string
  size: number
  label: string
}) => (
  <img
    src={image}
    width={size}
    height={size}
    className="seasonal-icon"
    alt={label}
  />
)

const Concept = ({ option }: { option: IconOption }) => (
  <article className="seasonal-concept">
    <div className="seasonal-concept-art">
      <SeasonalIcon
        image={option.image}
        size={112}
        label={option.title + ' icon concept for Tabby'}
      />
    </div>
    <div className="seasonal-concept-copy">
      <h3>{option.title}</h3>
      <p>{option.description}</p>
      <div className="seasonal-size-check">
        <span>16 px</span>
        <SeasonalIcon
          image={option.image}
          size={16}
          label={option.title + ' at 16 pixels'}
        />
      </div>
    </div>
  </article>
)

export const SeasonalIconsPage = () => (
  <main className="seasonal-page">
    <div className="seasonal-page-inner">
      <header className="seasonal-hero">
        <div className="seasonal-brand">
          <img src={tabbyFace} alt="" />
          <span>Tabby</span>
        </div>
        <div className="seasonal-hero-main">
          <div>
            <p className="seasonal-kicker">Seasonal icon concepts</p>
            <h1>
              Six holidays.
              <br />
              Eighteen little looks.
            </h1>
            <p className="seasonal-intro">
              A quick costume change for Tabby’s toolbar face. Each option has a
              large view and a 16 px check.
            </p>
          </div>
          <div className="seasonal-original">
            <span>Original Tabby</span>
            <img src={tabbyFace} alt="Tabby’s original face icon" />
          </div>
        </div>
      </header>

      <div className="seasonal-boards">
        {holidays.map((holiday) => (
          <section
            key={holiday.id}
            className="seasonal-board"
            style={
              {
                '--holiday-accent': holiday.accent,
                '--holiday-wash': holiday.wash,
              } as CSSProperties
            }
            aria-labelledby={holiday.id + '-title'}
          >
            <div className="seasonal-board-heading">
              <span className="seasonal-date">{holiday.date}</span>
              <h2 id={holiday.id + '-title'}>{holiday.name}</h2>
              {holiday.detail && <p>{holiday.detail}</p>}
            </div>
            <div className="seasonal-concepts">
              {holiday.concepts.map((option) => (
                <Concept key={option.title} option={option} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  </main>
)
