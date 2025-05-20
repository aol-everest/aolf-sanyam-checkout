/* eslint-disable react/no-unescaped-entities */
import Image from 'next/image';

export default function ThankYouPage() {
  return (
    <>
      <main>
        <section className="get-started">
          <div className="container-md">
            <div className="row align-items-center">
              <div className="col-lg-5 col-md-12 p-md-0">
                <div className="get-started__info">
                  <h3 className="get-started__subtitle">You're going!</h3>
                  <h1 className="get-started__title section-title">Sanyam 2</h1>
                  <p className="get-started__text">
                    You're registered for Art of Living Course, from Fri, May
                    16, 2025 - Thank you for registering! Your spot for the
                    Sanyam 2 Course starting Friday, July 11, 2025, is
                    confirmed. We’ll notify you soon with everything you need to
                    know.
                  </p>
                </div>
                <p className="get-started__text">
                  <br />
                  To get started, download the app.
                </p>
                <div className="btn-wrapper">
                  <a
                    className="btn-outline tw-mr-2"
                    href="https://apps.apple.com/us-en/app/art-of-living-journey/id1469587414?ls=1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src="/images/ic-apple.svg"
                      alt="iOS"
                      width={24}
                      height={24}
                    />
                    iOS App
                    {/* <Image src="/img/ic-apple.svg" alt="apple">iOS App */}
                  </a>
                  &nbsp;
                  <a
                    className="btn-outline"
                    href="https://play.google.com/store/apps/details?id=com.aol.app"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src="/images/ic-android.svg"
                      alt="Android"
                      width={24}
                      height={24}
                    />
                    Android App
                  </a>
                </div>
              </div>
              <div className="col-lg-6 col-md-12 offset-lg-1 p-0">
                <div className="get-started__video">
                  <Image
                    src="/images/image@3x.png"
                    alt="AOL"
                    width={570}
                    height={350}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="journey-starts !tw-mb-0">
          <div className="container">
            <div className="program-details">
              <h2 className="program-details__title">Program Details</h2>
              <ul className="program-details__list-schedule tw-max-h-[400px] tw-overflow-y-auto mb-2">
                <li className="program-details__schedule tw-flex">
                  <span className="program-details__schedule-date">
                    July 11, 2025
                  </span>
                  <span className="program-details__schedule-time tw-ml-2">
                    Fri: 7:00AM-9:00PM EST <br />
                    Sat: 7:00AM-9:00PM EST <br />
                    Sun: 7:00AM-9:00PM EST <br />
                    Mon: 7:00AM-9:00PM EST <br />
                    Tue: 7:00AM-9:00PM EST <br />
                    Wed: 7:00AM-9:00PM EST
                  </span>
                </li>
              </ul>
              <ul className="program-details__list-schedule tw-mt-2">
                <span className="program-details__schedule-date">Location</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&amp;query=949 Whispering Hills Road, Boone NC 28607 US"
                  target="_blank"
                  rel="noreferrer"
                >
                  <li className="tw-truncate tw-text-sm tw-tracking-tighter !tw-text-[#3d8be8]">
                    949 Whispering Hills Road,{' '}
                  </li>
                  <li className="tw-truncate tw-text-sm tw-tracking-tighter !tw-text-[#3d8be8]">
                    Boone, NC 28607
                  </li>
                </a>
              </ul>
            </div>
            <h2 className="journey-starts__title section-title">
              Your journey starts here
            </h2>
            <div className="journey-starts__step">
              <div className="journey-starts__step-number">
                <span>1</span>
              </div>
              <div className="journey-starts__detail">
                <h3 className="journey-starts__step-title">This is you-time</h3>
                <p className="journey-starts__step-text">
                  It's a great time to clear your calendar for your retreat. Get
                  ready to drop stress, recharge your batteries, and re-align
                  with your inner truth.
                </p>
              </div>
            </div>
            <div className="journey-starts__step">
              <div className="journey-starts__step-number">
                <span>2</span>
              </div>
              <div className="journey-starts__detail">
                <h3 className="journey-starts__step-title">
                  Health And Safety
                </h3>
                <p className="journey-starts__step-text">
                  For the health and safety of all involved, if you're not
                  feeling well, we ask you to please stay at home.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-center mb-8">
          <Image
            src="/images/ic-logo.svg"
            alt="Art of Living Logo"
            width={115}
            height={45}
            className="h-16 w-auto"
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8 flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white">
            ✓
          </div>
          <p className="text-lg font-medium">You&apos;re going!</p>
        </div>

        <h1 className="text-3xl font-bold mb-8">{order.courseTitle}</h1>

        <p className="text-lg mb-4">
          You&apos;re registered for {order.courseTitle}, from Fri,{" "}
          {order.courseDate}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <Button variant="outline" className="w-full">
              Add to Calendar
            </Button>
          </div>
          <div>
            <Image
              src="/images/meditation-image.jpg"
              alt="Meditation"
              width={500}
              height={300}
              className="rounded-lg w-full h-auto"
            />
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">
            Download the app and relax with a meditation
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#"
              className="bg-black text-white rounded-md px-6 py-2 flex items-center gap-2"
            >
              <Image
                src="/images/apple-icon.svg"
                alt="App Store"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              Download on the App Store
            </Link>
            <Link
              href="#"
              className="bg-black text-white rounded-md px-6 py-2 flex items-center gap-2"
            >
              <Image
                src="/images/google-play-icon.svg"
                alt="Google Play"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              Get it on Google Play
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Program details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">
                  <Image
                    src="/images/calendar-icon.svg"
                    alt="Calendar"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </span>
                <div>
                  <p>{order.courseDate}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.courseTime}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline">Add to Calendar</Button>
        </div>
      </div> */}
    </>
  );
}
