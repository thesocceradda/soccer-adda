import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IPost } from '../post.model';
import { DataUtils } from 'app/core/util/data-util.service';
import {DomSanitizer} from '@angular/platform-browser';


@Component({
  selector: 'jhi-post-detail',
  templateUrl: './post-detail.component.html',
})
export class PostDetailComponent implements OnInit {
  post: IPost | null = null;
  isImage = false;

  constructor(protected dataUtils: DataUtils, protected activatedRoute: ActivatedRoute, public domSanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ post }) => {
      if(!(post.imageData === "")){
        this.isImage = true;
        post.imageData = this.domSanitizer.bypassSecurityTrustUrl("data:image/jpeg;base64, " + (post.imageData! as string)) as string;
      }else{
        post.imageData = "";
      }
      this.post = post;
    });
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  previousState(): void {
    window.history.back();
  }
}
