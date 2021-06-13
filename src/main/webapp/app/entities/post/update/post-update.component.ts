import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import * as dayjs from 'dayjs';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';

import { IPost, Post } from '../post.model';
import { PostService } from '../service/post.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';
import { IBlog } from 'app/entities/blog/blog.model';
import { BlogService } from 'app/entities/blog/service/blog.service';
import { ITag } from 'app/entities/tag/tag.model';
import { TagService } from 'app/entities/tag/service/tag.service';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'jhi-post-update',
  templateUrl: './post-update.component.html',
})
export class PostUpdateComponent implements OnInit {
  isSaving = false;

  blogsSharedCollection: IBlog[] = [];
  tagsSharedCollection: ITag[] = [];
  account: Account | null = null;

  imgURL: any;
  receivedImageData: any;
  base64Data: any;
  convertedImage: any;
  selectedFile:any;
  isUpdate = false;

  editForm = this.fb.group({
    id: [],
    title: [null, [Validators.required]],
    content: [null, [Validators.required]],
    date: [null, [Validators.required]],
    blog: [],
    tags: [],
  });

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected postService: PostService,
    protected blogService: BlogService,
    protected tagService: TagService,
    protected activatedRoute: ActivatedRoute,
    protected fb: FormBuilder,
    private accountService: AccountService,
    public domSanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ post }) => {
      if (post.id === undefined) {
        const today = dayjs().startOf('day');
        post.date = today;
      }else{
        if(!(post.imageData === "")){
          this.imgURL = this.domSanitizer.bypassSecurityTrustUrl("data:image/jpeg;base64, " + (post.imageData! as string)) as string;
        }else{
          this.imgURL = "";
        }
        
        this.isUpdate = true;
      }

      this.updateForm(post);

      this.loadRelationshipsOptions();
    });
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  setFileData(event: Event, field: string, isImage: boolean): void {
    this.dataUtils.loadFileToForm(event, this.editForm, field, isImage).subscribe({
      error: (err: FileLoadError) =>
        this.eventManager.broadcast(
          new EventWithContent<AlertError>('socceraddaApp.error', { message: err.message })
        ),
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const post = this.createFromForm();
    if (post.id !== undefined) {
      this.subscribeToSaveResponse(this.postService.update(post));
    } else {
      this.subscribeToSaveResponse(this.postService.create(post));
    }
  }

  trackBlogById(index: number, item: IBlog): number {
    return item.id!;
  }

  trackTagById(index: number, item: ITag): number {
    return item.id!;
  }

  getSelectedTag(option: ITag, selectedVals?: ITag[]): ITag {
    if (selectedVals) {
      for (const selectedVal of selectedVals) {
        if (option.id === selectedVal.id) {
          return selectedVal;
        }
      }
    }
    return option;
  }

onFileChanged(event:any) : void {
  if(event.target.files[0].type.includes("jpeg") || event.target.files[0].type.includes("png") || event.target.files[0].type.includes("jpg")){
    if(event.target.files[0].size < 2000000) {
      this.selectedFile = event.target.files[0];
      // Below part is used to display the selected image
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = () => {
        this.imgURL = reader.result;
        };
    }else{
      alert("Please upload image of size less than 2MB");
    }  
  }else{
    alert("Please select valid Image. Supported extn are .PNG, .JPG, .JPEG");
  }
 }

 removeImage():void{
  this.imgURL = null;
  this.selectedFile = null;
 }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPost>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe(
      () => this.onSaveSuccess(),
      () => this.onSaveError()
    );
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(post: IPost): void {
    this.editForm.patchValue({
      id: post.id,
      title: post.title,
      content: post.content,
      date: post.date ? post.date.format(DATE_TIME_FORMAT) : null,
      blog: post.blog,
      tags: post.tags,
    });

    this.blogsSharedCollection = this.blogService.addBlogToCollectionIfMissing(this.blogsSharedCollection, post.blog);
    this.tagsSharedCollection = this.tagService.addTagToCollectionIfMissing(this.tagsSharedCollection, ...(post.tags ?? []));
  }

  protected loadRelationshipsOptions(): void {
    this.blogService
      .query()
      .pipe(map((res: HttpResponse<IBlog[]>) => res.body ?? []))
      .pipe(map((blogs: IBlog[]) => this.blogService.addBlogToCollectionIfMissing(blogs, this.editForm.get('blog')!.value)))
      .subscribe((blogs: IBlog[]) => (this.blogsSharedCollection = blogs));

    this.tagService
      .query()
      .pipe(map((res: HttpResponse<ITag[]>) => res.body ?? []))
      .pipe(map((tags: ITag[]) => this.tagService.addTagToCollectionIfMissing(tags, ...(this.editForm.get('tags')!.value ?? []))))
      .subscribe((tags: ITag[]) => (this.tagsSharedCollection = tags));
  }

  protected createFromForm(): IPost {
    this.accountService.identity().subscribe(account => {
      this.account = account;
    });
    let imageData = {
      base64: "",
      name: "",
      type: ""
    };
    if(!(this.imgURL === null)){
      imageData = {
        base64: this.isUpdate ? this.imgURL.toString().split (",").pop ().trim().split(" ")[0]: this.imgURL.toString().split (",").pop (),
        name: "postImage.jpg",
        type: "image/jpeg"
      };
    }
    
    return {
      ...new Post(),
      id: this.editForm.get(['id'])!.value,
      title: this.editForm.get(['title'])!.value,
      content: this.editForm.get(['content'])!.value,
      date: dayjs(),
      blog: this.editForm.get(['blog'])!.value,
      tags: this.editForm.get(['tags'])!.value,
      owner: this.account?.login,
      image: imageData
    };
  }
}
