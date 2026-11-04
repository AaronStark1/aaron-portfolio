/* Line-art doodles for the contact page, on a 24-unit grid with round caps
   and joins. Every stroke carries pathLength="1" so it can draw itself on;
   parts that act on their own (a ringing handset, typing dots, a heart
   leaving the envelope) sit in a group with an `art-*` class the stylesheet
   animates, so the draw-on rule on the stroke never competes with it.

   Geometry adapted from Lucide (https://lucide.dev): mail, message-circle-more,
   phone-call, at-sign, smartphone, heart, sparkle, send.
   ISC License, Copyright (c) Lucide Icons and Contributors. Permission to use,
   copy, modify, and/or distribute this software for any purpose with or
   without fee is hereby granted, provided that the above copyright notice and
   this permission notice appear in all copies. Parts derived from Feather
   (at-sign, smartphone): MIT License, Copyright (c) 2013-present Cole Bemis. */

import { HEART_D, PLANE_D, PLANE_FOLD_D } from "./doodlePaths";

const P = { pathLength: 1 };

/** Envelope; now and then a small heart floats out of it. */
export function MailArt() {
  return (
    <>
      <g className="art-mail__heart">
        <path d={HEART_D} transform="translate(12 10) scale(0.42) translate(-12 -12.6)" />
      </g>
      <rect x="2" y="4" width="20" height="16" rx="2" {...P} />
      <path d="M22 7l-8.991 5.727a2 2 0 0 1-2.009 0L2 7" {...P} />
    </>
  );
}

/** Chat bubble whose dots type, like someone replying. */
export function ChatArt() {
  return (
    <>
      <path
        d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092a10 10 0 1 0-4.777-4.719"
        {...P}
      />
      {[8, 12, 16].map((x, n) => (
        <g key={x} className="art-chat__dot" style={{ "--n": n }}>
          <path d={`M${x} 12h.01`} {...P} />
        </g>
      ))}
    </>
  );
}

/** Telephone handset that rings: a rattle and two sound waves. */
export function PhoneArt() {
  return (
    <>
      <g className="art-phone__wave art-phone__wave--outer">
        <path d="M13 2a9 9 0 0 1 9 9" {...P} />
      </g>
      <g className="art-phone__wave art-phone__wave--inner">
        <path d="M13 6a5 5 0 0 1 5 5" {...P} />
      </g>
      <g className="art-phone__handset">
        <path
          d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233a14 14 0 0 0 6.392 6.384"
          {...P}
        />
      </g>
    </>
  );
}

/** The at sign, which takes a spin every so often. */
export function AtArt() {
  return (
    <g className="art-at">
      <circle cx="12" cy="12" r="4" {...P} />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" {...P} />
    </g>
  );
}

/** Smartphone that buzzes as a notification badge pops up. */
export function MobileArt() {
  return (
    <>
      <g className="art-mobile__body">
        <rect x="5" y="2" width="14" height="20" rx="2" {...P} />
        <path d="M12 18h.01" {...P} />
        <path d="M9 7h6M9 10.5h4" {...P} />
      </g>
      <circle className="art-mobile__badge" cx="18.5" cy="3.5" r="2.4" />
    </>
  );
}

/** A heart that beats twice now and then. */
export function HeartArt() {
  return (
    <g className="art-heart">
      <path d={HEART_D} {...P} />
    </g>
  );
}

/** Four-point sparkle, twinkling. */
export function SparkleArt() {
  return (
    <g className="art-sparkle">
      <path
        d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
        {...P}
      />
    </g>
  );
}

/** Paper plane. */
export function PlaneArt() {
  return (
    <>
      <path d={PLANE_D} {...P} />
      <path d={PLANE_FOLD_D} {...P} />
    </>
  );
}
