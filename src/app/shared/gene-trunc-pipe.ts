import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'geneTrunc',
    standalone: false
})
export class GeneTruncPipe implements PipeTransform {
  transform(sequence: string) {
    if (!sequence || sequence.length < 15) {
      return sequence;
    } else {
      return sequence.slice(0, 12) + '...';
    }
  }
}
