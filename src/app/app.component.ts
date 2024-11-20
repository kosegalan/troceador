import { DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  Inject,
  Signal,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { SafeHtmlPipe } from './util/safe-html-pipe.pipe';

interface Flag {
  tag: string;
  start: number;
  end: number;
}

interface FlagId {
  id: number;
  flag: Flag;
  section: number[];
}

const dataText =
  '1234567 891 011 12 1314 1516\n171 33435363 73 8394 0414\n2434 4454647 484 95051 5253 56555\n457 58596 06 16 26 364 656 667';

const flags: Flag[] = [
  { start: 20, end: 35, tag: 'tag1' },
  { start: 40, end: 55, tag: 'tag2' },
  { start: 55, end: 70, tag: 'tag3' },
  { start: 65, end: 80, tag: 'tag4' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SafeHtmlPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  selectedFlag = signal<FlagId | undefined>(undefined);
  flagsIds: FlagId[] = flags.map((flag, index) => {
    return { id: index, flag: flag, section: [] };
  });
  renderText = signal('');

  clickFlag(flag: FlagId) {
    const allActives = document.getElementsByClassName(`active`);
    while (allActives.length) allActives[0].className = ''; // clean all from old actives elements

    this.selectedFlag.set(flag);
    flag.section.forEach((id) => {
      const element = document.getElementById(`section-id-${id}`);
      const classList = element?.classList;
      classList?.add(`active`, `${flag.flag.tag}`);
    });
    document
      .getElementById(`section-id-${flag.section[0]}`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  outOverFlag(flag: FlagId) {
    flag.section.forEach((id) => {
      const element = document.getElementById(`section-id-${id}`);
      if (!element) return;
      if (flag !== this.selectedFlag()) {
        element.classList.remove(flag.flag.tag);
      }

      element.classList.remove(`show`);
    });
  }
  overFlag(flag: FlagId) {
    flag.section.forEach((id) => {
      const element = document.getElementById(`section-id-${id}`);
      element?.classList.add(`show`, `${flag.flag.tag}`);
    });
  }

  constructor(
    @Inject(DOCUMENT) document: Document,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.chopper();
  }

  chopper = () => {
    // Build list unique separators flag
    let indexToChopper = new Set<number>();
    let flagsSorted = flags.sort((a, b) => {
      return a.start - b.start;
    });
    flags.forEach((previous) => {
      indexToChopper.add(previous.start);
      indexToChopper.add(previous.end);
    });

    // Travel separators and build render text injecting html
    const lastIndex = [...indexToChopper]
      .sort() // sort index to traveling succesful
      .reduce((previous, next, index) => {
        flagsSorted.every((flag) => {
          if (flag.start > next) return false;

          if (flag.start <= previous && flag.end >= next) {
            this.flagsIds
              .filter((key) => key.flag === flag)[0]
              ?.section.push(index);
          }
          return true;
        });
        this.renderText.update(
          (value) =>
            (value += `<span id="section-id-${index}"> ${dataText
              .substring(previous, next)
              .replaceAll(/\n/g, '<br>')}</span>`)
        );
        return next;
      }, 0);
    this.renderText.update(
      (value) =>
        (value += `<span>${dataText
          .substring(lastIndex)
          .replaceAll(/\n/g, '<br>')}</span>`)
    );
  };
}
